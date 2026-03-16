package sse

import (
	"encoding/json"
	"fmt"
	"sync"
)

// ClientesBroker is the singleton broker for client registration events.
var ClientesBroker = newBroker()

type subscriber struct {
	ch chan string
}

type broker struct {
	mu      sync.RWMutex
	clients map[*subscriber]struct{}
}

func newBroker() *broker {
	return &broker{
		clients: make(map[*subscriber]struct{}),
	}
}

// Subscribe registers a new listener and returns its private channel.
func (b *broker) Subscribe() *subscriber {
	s := &subscriber{ch: make(chan string, 8)}
	b.mu.Lock()
	b.clients[s] = struct{}{}
	b.mu.Unlock()
	return s
}

// Unsubscribe removes the listener and closes its channel.
func (b *broker) Unsubscribe(s *subscriber) {
	b.mu.Lock()
	if _, ok := b.clients[s]; ok {
		delete(b.clients, s)
		close(s.ch)
	}
	b.mu.Unlock()
}

// Broadcast sends an SSE-formatted event to every connected subscriber.
// Slow clients are skipped to avoid blocking the caller.
func (b *broker) Broadcast(eventName string, data interface{}) {
	payload, err := json.Marshal(data)
	if err != nil {
		return
	}
	msg := fmt.Sprintf("event: %s\ndata: %s\n\n", eventName, string(payload))

	b.mu.RLock()
	defer b.mu.RUnlock()
	for s := range b.clients {
		select {
		case s.ch <- msg:
		default:
			// Subscriber is too slow — drop the message rather than blocking.
		}
	}
}

// Channel returns the read-only event channel for this subscriber.
func (s *subscriber) Channel() <-chan string {
	return s.ch
}
