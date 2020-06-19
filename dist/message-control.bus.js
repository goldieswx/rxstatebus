"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageControlBus = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var _ = __importStar(require("lodash"));
var MessageControlBus = /** @class */ (function () {
    function MessageControlBus(_messageStateHandler) {
        this._messageStateHandler = _messageStateHandler;
        this._messageBus = new rxjs_1.Subject();
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
    MessageControlBus.prototype.getMessageBus = function (filterFn) {
        var _this = this;
        var usedFilter = function (header) { return true; };
        if (_.isFunction(filterFn)) {
            usedFilter = filterFn;
        }
        else if (_.isObject(filterFn)) {
            var filterObj_1 = filterFn;
            usedFilter = function (header) {
                var message = _this._messageStateHandler.getMessage(header);
                if (message && ((!filterObj_1.serviceId) || (filterObj_1.serviceId === message.serviceId))) {
                    /* Extract hooks from current sequenceId, we are only interested of the messages at the time
                     *  or prior to the header hence > subSequenceCount */
                    var usedHooks = _.filter(message.hooks, function (m) { return m.subSequenceId <= header.subSequenceCount; });
                    var usedHooksIds = usedHooks.map(function (m) { return m.hookId; });
                    var ret = (_.difference(filterObj_1.hooks.justAfter, usedHooksIds).length === 0)
                        && (_.indexOf(filterObj_1.hooks.justAfter, _.last(usedHooksIds)) >= 0);
                    if (filterObj_1.hooks.withValid && ret) {
                        var validHooks = _.filter(usedHooks, function (m) { return !!m.data; }).map(function (m) { return m.hookId; });
                        ret = _.difference(filterObj_1.hooks.withValid, validHooks).length === 0;
                    }
                    return ret;
                }
                return false;
            };
        }
        return this._messageBus.asObservable().pipe(operators_1.filter(usedFilter));
    };
    MessageControlBus.prototype.processIncomingMessage = function (serviceId, message, timestamp, itemId) {
        var msg = this._messageStateHandler.newMessage(serviceId, itemId, message, timestamp, false);
        this._messageBus.next({
            serviceId: serviceId,
            itemId: itemId,
            sequenceId: msg.current.sequenceId
        });
    };
    MessageControlBus.prototype.reset = function (serviceId) {
        var _this = this;
        this._messageStateHandler.callServiceItems(serviceId, function (itemId) {
            var msg = _this._messageStateHandler.newMessage(serviceId, itemId, null, null, true);
            _this._messageBus.next({
                serviceId: serviceId,
                itemId: itemId,
                sequenceId: msg.current.sequenceId
            });
        });
    };
    MessageControlBus.prototype.processHookMessage = function (serviceId, itemId, hookId, hookFn, compactFn) {
        // serviceId: string, itemId: any, hookId: string,
        var msg = this._messageStateHandler.hookMessage(serviceId, itemId, hookId, hookFn, compactFn);
        if (msg) {
            this._messageBus.next({
                serviceId: serviceId,
                itemId: itemId,
                sequenceId: msg.current.sequenceId,
                hookId: hookId,
                subSequenceCount: msg.current.subSequenceCount
            });
        }
    };
    return MessageControlBus;
}());
exports.MessageControlBus = MessageControlBus;
