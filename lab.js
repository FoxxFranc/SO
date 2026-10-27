/* Локальная модель API. Никакие HTTP-запросы во внешнюю сеть не отправляются. */
class LabEngine {
  constructor(){this.reset();}
  reset(){
    this.menu=[{id:7,name:'Чай с мятой',category:'drinks',price:170},{id:3,name:'Капучино',category:'drinks',price:230},{id:9,name:'Томатный суп',category:'food',price:310}];
    this.orders=[{id:42,itemId:7,quantity:1,status:'new'}];this.nextId=43;
  }
  result(status,body,explanation,extra={}){
    const names={200:'OK',201:'Created',204:'No Content',400:'Bad Request',404:'Not Found',405:'Method Not Allowed',406:'Not Acceptable',415:'Unsupported Media Type',422:'Unprocessable Content'};
    return {status,statusText:names[status],headers:{...(status!==204?{'Content-Type':'application/json'}:{}),...extra},body:body===undefined?undefined:JSON.parse(JSON.stringify(body)),explanation};
  }
  execute({method='GET',url='',headers='',body=''}){
    const fail=(status,error,message,extra)=>this.result(status,{error,message},message,extra);
    method=String(method).toUpperCase();
    let target;
    try{if(!url.startsWith('/')||url.startsWith('//'))throw Error();target=new URL(url,'https://cafe.example');if(target.origin!=='https://cafe.example'||target.hash)throw Error();}catch{return fail(400,'INVALID_URL','Введи путь от /api, без домена и фрагмента #. Например: /api/orders/42.');}
    const requestHeaders={};
    for(const line of headers.split(/\r?\n/).filter(x=>x.trim())){
      const split=line.indexOf(':');
      if(split<1)return fail(400,'INVALID_HEADER','Каждый заголовок записывается как Имя: значение.');
      requestHeaders[line.slice(0,split).trim().toLowerCase()]=line.slice(split+1).trim();
    }
    const accept=requestHeaders.accept;
    if(accept&&!accept.split(',').some(v=>['application/json','application/*','*/*'].includes(v.trim().split(';')[0])))return fail(406,'FORMAT_NOT_ACCEPTABLE','Этот учебный API возвращает JSON. Укажи Accept: application/json или */*.');
    const path=target.pathname.replace(/\/$/,'');
    const match=path.match(/^\/api\/orders\/([1-9]\d*)$/);
    const collection=path==='/api/orders',menu=path==='/api/menu';
    if(!collection&&!menu&&!match)return fail(404,'ROUTE_NOT_FOUND','Такой точки API нет. Попробуй /api/menu, /api/orders или /api/orders/42.');
    const allowed=menu?['GET']:collection?['GET','POST']:['GET','PUT','PATCH','DELETE'];
    if(!allowed.includes(method))return fail(405,'METHOD_NOT_ALLOWED','Этот метод не поддерживается по данному пути. Смотри заголовок Allow.',{Allow:allowed.join(', ')});
    const id=match?Number(match[1]):null;
    const order=match?this.orders.find(o=>o.id===id):null;
    if(match&&!order)return fail(404,'NOT_FOUND','Заказ не найден. После удаления GET и повторный DELETE возвращают 404.');
    if(method==='GET'){
      if(menu){let items=this.menu;const category=target.searchParams.get('category'),q=target.searchParams.get('q');if(category)items=items.filter(i=>i.category===category);if(q)items=items.filter(i=>i.name.toLowerCase().includes(q.toLowerCase()));return this.result(200,{items},items.length?'Меню получено. Query-параметры отфильтровали коллекцию; состояние не изменилось.':'Подходящих блюд нет. Пустая коллекция — успешный ответ 200 с пустым списком, а не отсутствие самого ресурса.');}
      return this.result(200,collection?{items:this.orders}:order,collection?'Коллекция заказов получена. GET не создаёт и не меняет заказы.':'Представление заказа получено. GET оставил его состояние прежним.');
    }
    if(method==='DELETE'){
      this.orders=this.orders.filter(o=>o.id!==id);
      return this.result(204,undefined,'Заказ удалён. У 204 нет тела. Повторный DELETE вернёт 404; итог состояния тот же — заказ отсутствует.');
    }
    if((requestHeaders['content-type']||'').split(';')[0].trim().toLowerCase()!=='application/json')return fail(415,'UNSUPPORTED_MEDIA_TYPE','Для POST, PUT и PATCH этот API принимает application/json. Добавь соответствующий Content-Type.');
    let data;
    try{data=JSON.parse(body);}catch{return fail(400,'INVALID_JSON','Тело не удалось разобрать как JSON. Проверь двойные кавычки, скобки и запятые.');}
    if(!data||typeof data!=='object'||Array.isArray(data))return fail(422,'VALIDATION_ERROR','Ожидается JSON-объект с itemId и quantity, а не массив, null или отдельное число.');
    const keys=Object.keys(data);
    if(keys.some(k=>!['itemId','quantity'].includes(k)))return fail(422,'UNKNOWN_FIELD','Разрешены только itemId и quantity. id и status задаёт сервер.');
    if(method!=='PATCH'&&(!Object.hasOwn(data,'itemId')||!Object.hasOwn(data,'quantity')))return fail(422,'MISSING_FIELD','POST и PUT требуют полное редактируемое представление: itemId и quantity. PUT не сохраняет пропущенные поля автоматически.');
    if(method==='PATCH'&&keys.length===0)return fail(422,'EMPTY_PATCH','Для PATCH укажи хотя бы одно изменяемое поле: itemId или quantity.');
    if(Object.hasOwn(data,'itemId')&&(!Number.isInteger(data.itemId)||!this.menu.some(i=>i.id===data.itemId)))return fail(422,'INVALID_ITEM','itemId должен быть числом: 7 (чай), 3 (капучино) или 9 (суп).');
    if(Object.hasOwn(data,'quantity')&&(!Number.isInteger(data.quantity)||data.quantity<1||data.quantity>10))return fail(422,'INVALID_QUANTITY','quantity должно быть целым числом от 1 до 10, без кавычек.');
    if(method==='POST'){
      const created={id:this.nextId++,itemId:data.itemId,quantity:data.quantity,status:'new'};this.orders.push(created);
      return this.result(201,created,'Новый заказ создан. Location указывает его адрес. Повтори POST — появится ещё один: защиты от дублей в этой модели нет.',{Location:'/api/orders/'+created.id});
    }
    if(method==='PUT'){order.itemId=data.itemId;order.quantity=data.quantity;return this.result(200,order,'Полное редактируемое представление заменено. Поля id и status управляются сервером. Повтор такого PUT сохранит тот же итог.');}
    Object.assign(order,data);
    return this.result(200,order,'Изменены только переданные поля. В этом API PATCH с присвоением значений идемпотентен; для PATCH в целом это не гарантируется.');
  }
}
if(typeof module!=='undefined')module.exports={LabEngine};
if(typeof window!=='undefined')window.LabEngine=LabEngine;
