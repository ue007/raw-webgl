import { Trigger } from '../index';

let trigger = new Trigger();
console.log(trigger);

let callback = (e: any) => {
  console.log(e);
};
// 订阅监听事件
trigger.on('change', callback);
// 发布监听事件
trigger.firePropertyChanged('source', null, trigger);

// 发布监听事件
trigger.firePropertyChanged('source', null, trigger);

// 发布监听事件
trigger.firePropertyChanged('source', null, trigger);

// 取消订阅监听事件
trigger.off('change', callback);

// 发布监听事件
trigger.firePropertyChanged('source', null, trigger);
