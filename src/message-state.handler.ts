
import * as _ from 'lodash';

import {
    BusMessage,
    BusMessageCollection,
    BusMessageHeader,
    BusMessageHook,
    MessageStateCompactedMessage
} from "./types/bus.type";


export class MessageStateHandler {

    private _busMessages: { [index: string]: BusMessageCollection<any> };
    private _sequenceId: number;
    private _retainInHistory : number;

    constructor(options ?: any) {
        this._sequenceId = 1;
        this._retainInHistory = (options && options.retainInHistory) || 20;
        this._busMessages = {};
    }

    private _getNextSequenceId(): number {
        return (this._sequenceId++);
    }

    private _updateHistoryWithCurrent (messageCollection : BusMessageCollection<any>) {
        messageCollection.history.push(_.cloneDeep(messageCollection.current));
        messageCollection.history = messageCollection.history.slice(-this._retainInHistory);
    }

    private _findSequence(messages : BusMessageCollection<any>, header : BusMessageHeader) : BusMessage<any> {

        if (header.sequenceId === null) {
            return messages && messages.current;
        }

        if (messages && messages.current.sequenceId == header.sequenceId) {
            return messages.current;
        } else {
            return _.find(messages.history,(m : BusMessage<any>) => m.sequenceId === header.sequenceId);
        }
    };

    private _findSequenceHistory(messages : BusMessageCollection<any>, header : BusMessageHeader,includeCurrent : boolean) : BusMessage<any>[] {

        let history : BusMessage<any>[] = [];
        if (messages && messages.current && header.sequenceId === null) {
            header.sequenceId = messages.current.sequenceId;
        }

        if (includeCurrent && messages && messages.current.sequenceId <= header.sequenceId) {
            history.push(messages.current);
        }

        let filtered : BusMessage<any>[] = _.filter(messages.history,(m : BusMessage<any>) => m.sequenceId <= header.sequenceId);
        if (filtered && filtered.length) {
            history.push(... filtered);
        }

        return _.sortBy(history,'sequenceId');
    }

    public getHook<T>(header : BusMessageHeader, hookId : string) : BusMessageHook<T> {

        const messages : BusMessageCollection<any> = this._getBusMessages(header.serviceId,header.itemId);

        if (messages) {
            const message: BusMessage<any> = this._findSequence(messages, header);
            if (message) {
                return _.find(message.hooks, (h: BusMessageHook<any>) => (h.hookId === hookId));
            }
        }
        return null;
    }

    public getMessage<T>(header : BusMessageHeader) : BusMessage<T> {

        const messages : BusMessageCollection<any> = this._getBusMessages(header.serviceId,header.itemId);

        if (messages) {
            const message: BusMessage<T> = this._findSequence(messages, header);
            return message || null;
        }
        return null;
    }


    public getHookHistory<T>(header : BusMessageHeader, hookId : string,includeCurrent : boolean) : BusMessageHook<T>[] {

        const messages : BusMessageCollection<any> = this._getBusMessages(header.serviceId,header.itemId);
        if (messages) {
            const message: BusMessage<any>[] = this._findSequenceHistory(messages, header, includeCurrent);
            if (message) {
                return _.compact(message.map((m: BusMessage<any>) => _.find(m.hooks, (h: BusMessageHook<any>) => ((h.data) && (h.hookId === hookId)))));
            }
        }
        return [];
    }

    public getDataHistory<T>(header : BusMessageHeader, includeCurrent : boolean) : T[] {

        const messages : BusMessageCollection<any> = this._getBusMessages(header.serviceId,header.itemId);
        if (messages) {
            const message: BusMessage<T>[] = this._findSequenceHistory(messages, header, includeCurrent);
            if (message) {
                return _.compact(message.map((m: BusMessage<T>) => m.data));
            }
        }
        return [];
    }



    public newMessage(serviceId: string, itemId: any,data : any, timestamp: Date,clear : boolean) : BusMessageCollection<any> {

        let messageCollection = this._getBusMessages(serviceId, itemId);

        if (!messageCollection) {
            let key = `${serviceId}/${itemId}`;
            messageCollection = {
                current: {
                    serviceId: serviceId,
                    itemId: itemId,
                    data: data,
                    sequenceId: this._getNextSequenceId(),
                    subSequenceCount: 1, // order in which hooks were added.
                    hooks: [],
                    timestamp: timestamp,
                    head : clear
                }, history: []
            };
            this._busMessages[key] = messageCollection;
        } else {

            if (clear) {
                messageCollection.history = [];
            } else {
                this._updateHistoryWithCurrent(messageCollection);
            }
            messageCollection.current.data = data;
            messageCollection.current.head = clear;
            messageCollection.current.hooks = [];
            messageCollection.current.sequenceId = this._getNextSequenceId();
            messageCollection.current.subSequenceCount = 1;
            messageCollection.current.timestamp = timestamp;
        }

        return messageCollection;
    }

    private _getBusMessages(serviceId: string, itemId: any): BusMessageCollection<any> {

        let key = `${serviceId}/${itemId}`;

        let messages = this._busMessages[key];
        return messages;
    }

    public getBusMessages(serviceId: string, itemId: any): BusMessageCollection<any> {

        return this._getBusMessages(serviceId,itemId);
    }

    public callServiceItems(serviceId: string,fn : (itemId : string) => any) {

        serviceId = serviceId + '/';
        _.forOwn(this._busMessages,(v,k) => {
            if (k.indexOf(serviceId) === 0) {
                fn(k.split('/')[1])
            }
        })
    }

    public getServiceItems(serviceId: string,fn : (item : BusMessageCollection<any>, key : string) => any) {

        serviceId = serviceId + '/';
        _.forOwn(this._busMessages,(v,k) => {
            if (k.indexOf(serviceId) === 0) {
                fn(v,k.split('/')[1]);
            }
        })
    }


    public hookMessage(
            serviceId: string,
            itemId: any,
            hookId: string,
            hookFn: (BusMessageCollection, serviceId ?: string, itemId ?: any, hookId ?: string) => any,
            compactFn ?: (resultingHookData : any) => any
        ) : BusMessageCollection<any> {

        let busCollection: BusMessageCollection<any> = this._getBusMessages(serviceId, itemId);
        if (_.isFunction(hookFn)) {
            const newHook: any = hookFn(busCollection, serviceId, itemId, hookId);
            const compacted: any = newHook && compactFn && compactFn(newHook) || null;

            //if (newHook) {
            busCollection.current.hooks.push({
                hookId: hookId,
                data: newHook || null,
                subSequenceId: (++busCollection.current.subSequenceCount),
                compacted :  _.isObject(compacted)?compacted:null
            });
            return busCollection;
            //}
        }

        return null;
    }


    public compactMessage<T>(m: BusMessage<any>) : MessageStateCompactedMessage<T> {

            const compacted : MessageStateCompactedMessage<any> = {
                    iId: m.itemId,
                    t: m.timestamp,
                    d: {}
                };



            _.forEach(m.hooks,(h : BusMessageHook<any>) => {
                   if  (_.isObject(h.compacted)) {
                       _.merge(compacted.d,h.compacted);
                   }
            });

            return compacted;
    }
}
