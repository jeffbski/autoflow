/*global define:true */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  'use strict';

  /**
     create an instance of the event collector
  */
  function instantiate(react) {
    react.trackTasks(); // enable task tracking

    var AST_EVENTS_RE = /^ast\./;
    var TASK_EVENTS_RE = /^task\./;
    var FLOW_EVENTS_RE = /^flow\./;

    /**
       Accumulator to make it easy to capture events

       @example
       var react = require('react');
       var collector = react.createEventCollector();
       collector.capture(); // capture all flow and task events for all react flows
       collector.capture('flow.*'); // capture all flow events for all react flows
       collector.capture(flowFn, 'task.*'); // capture task events on a flow
       collector.capture(flowFn, 'flow.*'); // add capture flow events on a flow
       var events = collector.list();  // retrieve the list of events
       collector.clear();  // clear the list of events;
    */
    function EventCollector() {
      this.events = [];
    }

    /**
       register listener to capture events for a specific flow
       @param flowFn the react flow function or can pass global react
       @param eventId event id or wildcarded id
    */
    EventCollector.prototype.capture = function (flowFn, eventId) {
      /*jshint validthis: true */
      if (!eventId && typeof(flowFn) === 'string') { // only eventId provided
        eventId = flowFn;
        flowFn = react; // global react
      } else if (!flowFn) flowFn = react; // global react
      if (!eventId) eventId = '*'; // default to all
      var emitter = flowFn.events;
      var self = this;
      function accumEvents(obj) {
        var eventObject = {
          event: this.event,
          time: Date.now()
        };
        if (FLOW_EVENTS_RE.test(this.event)) {
          eventObject.env = obj;
        } else if (TASK_EVENTS_RE.test(this.event)) {
          eventObject.task = obj;
        } else if (AST_EVENTS_RE.test(this.event)) {
          eventObject.ast = obj;
        }
        self.events.push(eventObject);
      }
      emitter.on(eventId, accumEvents);
    };

    EventCollector.prototype.list = function () {
      return this.events;
    };

    EventCollector.prototype.clear = function () {
      this.events = []; // clear
    };

    return new EventCollector();
  }

  return instantiate; // return the factory for creating EventCollector

});