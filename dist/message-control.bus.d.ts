import { Observable } from "rxjs";
import { MessageStateHandler } from "./message-state.handler";
import { BusMessageHeader } from "./types/bus.type";
export declare class MessageControlBus {
    private _messageStateHandler;
    private _messageBus;
    constructor(_messageStateHandler: MessageStateHandler);
    /**
     * Gets access to the message(headers) bus messages within an observable.
     * @param filterFn : - either without parameters (unfiltered)
     *                   - either with a predicate function giving the header.
     *                   - either with an object { hooks: { withValid:[..hookids..], justAfter[..hookids..]} in which case
     *                     the last message(hook) completing the "justAfter" hook array will be triggerred
     *                      (disregarding the fact that the hook(s) have returned any valid data; except
     *                      if they are included in the "withValid" array). Note: withValid
     */
    getMessageBus(filterFn?: ((msg: BusMessageHeader) => boolean) | {
        serviceId?: string;
        hooks: {
            justAfter: string[];
            withValid?: string[];
        };
    }): Observable<BusMessageHeader>;
    processIncomingMessage<T>(serviceId: string, message: T, timestamp: Date, itemId: string): void;
    reset(serviceId: string): void;
    processHookMessage(serviceId: string, itemId: string, hookId: string, hookFn: (BusMessageCollection: any, serviceId?: string, itemId?: any, hookId?: string) => any, compactFn?: (resultingHookData: any) => any): void;
}
