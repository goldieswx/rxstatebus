

import {Observable, Subject} from "rxjs";
import {
    MessageStateHandler
} from "./message-state.handler";

import {filter} from "rxjs/operators";
import * as _ from 'lodash';
import {BusMessage, BusMessageCollection, BusMessageHeader, BusMessageHook} from "./types/bus.type";


export class MessageControlBus {

    private _messageBus : Subject<BusMessageHeader>;

    constructor(private _messageStateHandler : MessageStateHandler) {
        this._messageBus = new Subject();
    }

    /**
     * Gets access to the message(headers) bus messages within an observable.
     * @param filterFn : - either without parameters (unfiltered)
     *                   - either with a predicate function giving the header.
     *                   - either with an object { hooks: { withValid:[..hookids..], justAfter[..hookids..]} in which case
     *                     the last message(hook) completing the "justAfter" hook array will be triggerred
     *                      (disregarding the fact that the hook(s) have returned any valid data; except
     *                      if they are included in the "withValid" array). Note: withValid
     */
    getMessageBus(filterFn ?: ((msg : BusMessageHeader) => boolean) |
        { serviceId ?: string, hooks : { justAfter: string[], withValid?: string[]}}) : Observable<BusMessageHeader> {

        let usedFilter = (header : BusMessageHeader) => true;

        if (_.isFunction(filterFn)) {
            usedFilter = (<(header : BusMessageHeader)=>boolean>filterFn);
        } else
        if (_.isObject(filterFn)) {
            const filterObj : any = filterFn;
            usedFilter = (header : BusMessageHeader) => {
                const message : BusMessage<any> = this._messageStateHandler.getMessage<any>(header);
                if (message && ((!filterObj.serviceId) || (filterObj.serviceId === message.serviceId))) {

                    /* Extract hooks from current sequenceId, we are only interested of the messages at the time
                     *  or prior to the header hence > subSequenceCount */
                    let usedHooks = _.filter(message.hooks,(m : BusMessageHook<any>) => m.subSequenceId <= header.subSequenceCount);
                    let usedHooksIds = usedHooks.map((m: BusMessageHook<any>) => m.hookId);

                    let ret = (_.difference(filterObj.hooks.justAfter,usedHooksIds).length === 0)
                        && (_.indexOf(filterObj.hooks.justAfter,_.last(usedHooksIds)) >= 0);

                    if (filterObj.hooks.withValid && ret) {
                        const validHooks = _.filter(usedHooks,(m : BusMessageHook<any>) => !!m.data).map((m: BusMessageHook<any>) => m.hookId);
                        ret = _.difference(filterObj.hooks.withValid,validHooks).length === 0;
                    }
                    return ret;
                }
                return false;
            };
        }

        return this._messageBus.asObservable().pipe(filter(usedFilter));
    }

    processIncomingMessage<T>(serviceId : string,message : T,timestamp : Date,itemId : string) {
        const msg : BusMessageCollection<T> = this._messageStateHandler.newMessage(serviceId,itemId,message,timestamp,false);
        this._messageBus.next({
            serviceId: serviceId,
            itemId: itemId,
            sequenceId: msg.current.sequenceId
        });
    }

    reset(serviceId : string) {
        this._messageStateHandler.callServiceItems(serviceId,(itemId : string) => {
            const msg : BusMessageCollection<any> = this._messageStateHandler.newMessage(serviceId,itemId,null,null,true);
            this._messageBus.next({
                serviceId: serviceId,
                itemId: itemId,
                sequenceId: msg.current.sequenceId
            });
        });

    }

    processHookMessage(
            serviceId : string,
            itemId : string,
            hookId : string,
            hookFn: (BusMessageCollection, serviceId ?: string, itemId ?: any, hookId ?:string) => any,
            compactFn ?: (resultingHookData : any) => any) {
        // serviceId: string, itemId: any, hookId: string,

        const msg : BusMessageCollection<any> = this._messageStateHandler.hookMessage(serviceId,itemId,hookId,hookFn,compactFn);

        if (msg) {

            this._messageBus.next({
                serviceId: serviceId,
                itemId: itemId,
                sequenceId: msg.current.sequenceId,
                hookId: hookId,
                subSequenceCount: msg.current.subSequenceCount
            });
        }
    }

}
