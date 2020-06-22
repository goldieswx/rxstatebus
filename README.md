# rxstatebus
A rxjs based data bus coupled with a state engine with history handling.

## What's rxstatebus 
rxstatebus is a transient state engine (live and immediate history state) for live or data replay (stream) handling. 

Its goal is to group several processes listenning to a stream an interacting with each other, in such a way that only a reference to the data is sent through the stream, so that latter is reduced to its bare minimal. All important data is stored in what's called the state handler. The state hanlder contains current data and immediate history.

It allows to process messages and to attach data to messages (hooks), while keeping all processes independant but in allowing processs an access to their immediate history and any other processes (that we calls hooks) too.

## Quick start

```
npm install rxstatebus
```

This is the simplest bus with a couple of messages.

![Alt text](img/rxstatebus-main.png?raw=true "Simplest bus")

```
import { Bus } from "rxstatebus";

myTickingService : Bus = new Bus();
myTickCount : number = 0;

setInterval(() => { 
     myTickCount ++;
     myService.processIncomingMessage ("my-service-id", { someId : myTickCount }, new Date(), "userid-9999"); 
}


```

