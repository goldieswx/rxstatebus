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
exports.MessageStateHandler = void 0;
var _ = __importStar(require("lodash"));
var MessageStateHandler = /** @class */ (function () {
    function MessageStateHandler(options) {
        this._sequenceId = 1;
        this._retainInHistory = (options && options.retainInHistory) || 20;
        this._busMessages = {};
    }
    MessageStateHandler.prototype._getNextSequenceId = function () {
        return (this._sequenceId++);
    };
    MessageStateHandler.prototype._updateHistoryWithCurrent = function (messageCollection) {
        messageCollection.history.push(_.cloneDeep(messageCollection.current));
        messageCollection.history = messageCollection.history.slice(-this._retainInHistory);
    };
    MessageStateHandler.prototype._findSequence = function (messages, header) {
        if (header.sequenceId === null) {
            return messages && messages.current;
        }
        if (messages && messages.current.sequenceId == header.sequenceId) {
            return messages.current;
        }
        else {
            return _.find(messages.history, function (m) { return m.sequenceId === header.sequenceId; });
        }
    };
    ;
    MessageStateHandler.prototype._findSequenceHistory = function (messages, header, includeCurrent) {
        var history = [];
        if (messages && messages.current && header.sequenceId === null) {
            header.sequenceId = messages.current.sequenceId;
        }
        if (includeCurrent && messages && messages.current.sequenceId <= header.sequenceId) {
            history.push(messages.current);
        }
        var filtered = _.filter(messages.history, function (m) { return m.sequenceId <= header.sequenceId; });
        if (filtered && filtered.length) {
            history.push.apply(history, filtered);
        }
        return _.sortBy(history, 'sequenceId');
    };
    MessageStateHandler.prototype.getHook = function (header, hookId) {
        var messages = this._getBusMessages(header.serviceId, header.itemId);
        if (messages) {
            var message = this._findSequence(messages, header);
            if (message) {
                return _.find(message.hooks, function (h) { return (h.hookId === hookId); });
            }
        }
        return null;
    };
    MessageStateHandler.prototype.getMessage = function (header) {
        var messages = this._getBusMessages(header.serviceId, header.itemId);
        if (messages) {
            var message = this._findSequence(messages, header);
            return message || null;
        }
        return null;
    };
    MessageStateHandler.prototype.getHookHistory = function (header, hookId, includeCurrent) {
        var messages = this._getBusMessages(header.serviceId, header.itemId);
        if (messages) {
            var message = this._findSequenceHistory(messages, header, includeCurrent);
            if (message) {
                return _.compact(message.map(function (m) { return _.find(m.hooks, function (h) { return ((h.data) && (h.hookId === hookId)); }); }));
            }
        }
        return [];
    };
    MessageStateHandler.prototype.getDataHistory = function (header, includeCurrent) {
        var messages = this._getBusMessages(header.serviceId, header.itemId);
        if (messages) {
            var message = this._findSequenceHistory(messages, header, includeCurrent);
            if (message) {
                return _.compact(message.map(function (m) { return m.data; }));
            }
        }
        return [];
    };
    MessageStateHandler.prototype.newMessage = function (serviceId, itemId, data, timestamp, clear) {
        var messageCollection = this._getBusMessages(serviceId, itemId);
        if (!messageCollection) {
            var key = serviceId + "/" + itemId;
            messageCollection = {
                current: {
                    serviceId: serviceId,
                    itemId: itemId,
                    data: data,
                    sequenceId: this._getNextSequenceId(),
                    subSequenceCount: 1,
                    hooks: [],
                    timestamp: timestamp,
                    head: clear
                }, history: []
            };
            this._busMessages[key] = messageCollection;
        }
        else {
            if (clear) {
                messageCollection.history = [];
            }
            else {
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
    };
    MessageStateHandler.prototype._getBusMessages = function (serviceId, itemId) {
        var key = serviceId + "/" + itemId;
        var messages = this._busMessages[key];
        return messages;
    };
    MessageStateHandler.prototype.getBusMessages = function (serviceId, itemId) {
        return this._getBusMessages(serviceId, itemId);
    };
    MessageStateHandler.prototype.callServiceItems = function (serviceId, fn) {
        serviceId = serviceId + '/';
        _.forOwn(this._busMessages, function (v, k) {
            if (k.indexOf(serviceId) === 0) {
                fn(k.split('/')[1]);
            }
        });
    };
    MessageStateHandler.prototype.getServiceItems = function (serviceId, fn) {
        serviceId = serviceId + '/';
        _.forOwn(this._busMessages, function (v, k) {
            if (k.indexOf(serviceId) === 0) {
                fn(v, k.split('/')[1]);
            }
        });
    };
    MessageStateHandler.prototype.hookMessage = function (serviceId, itemId, hookId, hookFn, compactFn) {
        var busCollection = this._getBusMessages(serviceId, itemId);
        if (_.isFunction(hookFn)) {
            var newHook = hookFn(busCollection, serviceId, itemId, hookId);
            var compacted = newHook && compactFn && compactFn(newHook) || null;
            //if (newHook) {
            busCollection.current.hooks.push({
                hookId: hookId,
                data: newHook || null,
                subSequenceId: (++busCollection.current.subSequenceCount),
                compacted: _.isObject(compacted) ? compacted : null
            });
            return busCollection;
            //}
        }
        return null;
    };
    MessageStateHandler.prototype.compactMessage = function (m) {
        var compacted = {
            iId: m.itemId,
            t: m.timestamp,
            d: {}
        };
        _.forEach(m.hooks, function (h) {
            if (_.isObject(h.compacted)) {
                _.merge(compacted.d, h.compacted);
            }
        });
        return compacted;
    };
    return MessageStateHandler;
}());
exports.MessageStateHandler = MessageStateHandler;
