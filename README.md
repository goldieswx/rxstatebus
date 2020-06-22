# rxstatebus
A rxjs based data bus coupled with a state engine with history handling.

## What's rxstatebus 
rxstatebus is a transient state engine (live and immediate history state) for live or data replay (stream) handling. 

Its goal is to group several processes listenning to a stream interacting with each other, in such a way that only a reference to the data is sent through the stream, so that latter is reduced to its bare minimal. All historical data is stored in what's called the state handler. The state hanlder contains current data and immediate history (typically 20 last events, but this can be changed) .

It allows to process messages and to attach data to messages (hooks), while keeping all processes independant but in allowing processs an access to their immediate history and any other processes (that we calls hooks) too.

## Quick start

```
npm install rxstatebus
```

Define a simple bus and send a couple of messages at a timed interval. Messages are timestamped and should have an identifier, so that it can be referenced later in the history (serviceid/messageid/sequenceid).  

![Alt text](img/rxstatebus-main.png?raw=true "Simplest bus")

Our service data will be defined as follows

```
type TMyServiceData = {
     someId : number;
}
```

Now we create the initial bus and write some data into it.

```
import { Bus } from "rxstatebus";

messageBus : Bus = new Bus();
myTickCount : number = 0;

setInterval(() => { 
     myTickCount ++;
     messageBus.processIncomingMessage (
          "my-service-id", 
          <TMyServiceData> { someId : myTickCount }, 
          new Date(), 
          "userid-9999"
     ); 
}
```

Let's subscribe to the stream.

```
import { State } from "rxstatebus";

const messageState : State = new State(messageBus);

messageState.getMessageBus((filter) => filter.serviceId === "my-service-id")
            .subscribe(
                    header: BusMessageHeader<TMyServiceData> => {
                         console.log (messageState.getMessage(header))
                    }
             );
```


