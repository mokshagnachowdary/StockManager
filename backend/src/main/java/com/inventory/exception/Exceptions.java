package com.inventory.exception;

public class Exceptions {
    public static class NotFound extends RuntimeException {
        public NotFound(String entity, Object id) {
            super(entity + " not found with id: " + id);
        }
    }
    public static class BadRequest extends RuntimeException {
        public BadRequest(String msg) { super(msg); }
    }
    public static class InsufficientStock extends RuntimeException {
        public InsufficientStock(String msg) { super(msg); }
    }
}
