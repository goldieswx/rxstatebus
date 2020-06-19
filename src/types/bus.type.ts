export type BusMessageHook<T> = {

    hookId: string; /* mapTracking/firstStage/postTracking */
    data: T;
    compacted: any;
    subSequenceId: number;

};

export type BusMessage<T> = {

    serviceId: string; /* Beacon, Map */
    itemId: any; /* BeaconId/MapId */
    sequenceId: number;
    subSequenceCount: number; // order in which hooks were added.
    data : T;
    hooks: BusMessageHook<any>[];
    timestamp: Date;
    head : boolean; // first message of a new stream (of events) (/skip/stream switch)
};

export type BusMessageCollection<T> = {
    current: BusMessage<T>;
    history: BusMessage<T>[];
}

export type BusMessageHeader = {

    serviceId: string; /* Beacon, Map */
    itemId: any; /* BeaconId/MapId */
    sequenceId: number;
    subSequenceCount ?: number; // order in which hooks were added
    hookId ?: string;
}

export type MessageStateCompactedMessage<T> = {

    iId : string; //item Id
    t : Date;  // time
    d : T;     // data
}

export type StreamedMessage<T> = {

    stream : string;
    d: T;
}

export type BusHookCutoffDetection = {
    outOfRange : boolean;
    _pending : boolean;
}


