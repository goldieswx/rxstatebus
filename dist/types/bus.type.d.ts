export declare type BusMessageHook<T> = {
    hookId: string;
    data: T;
    compacted: any;
    subSequenceId: number;
};
export declare type BusMessage<T> = {
    serviceId: string;
    itemId: any;
    sequenceId: number;
    subSequenceCount: number;
    data: T;
    hooks: BusMessageHook<any>[];
    timestamp: Date;
    head: boolean;
};
export declare type BusMessageCollection<T> = {
    current: BusMessage<T>;
    history: BusMessage<T>[];
};
export declare type BusMessageHeader = {
    serviceId: string;
    itemId: any;
    sequenceId: number;
    subSequenceCount?: number;
    hookId?: string;
};
export declare type MessageStateCompactedMessage<T> = {
    iId: string;
    t: Date;
    d: T;
};
export declare type StreamedMessage<T> = {
    stream: string;
    d: T;
};
export declare type BusHookCutoffDetection = {
    outOfRange: boolean;
    _pending: boolean;
};
