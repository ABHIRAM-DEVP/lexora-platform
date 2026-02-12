package com.lexora.lexora_backend.common.exception;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {


         @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", ex.getMessage()
        ));
    }

    @ExceptionHandler(InvalidFileTypeException.class)
    public ResponseEntity<ErrorResponse> handleInvalidFileType(
            InvalidFileTypeException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(FileSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleFileSizeExceeded(
            FileSizeExceededException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE,
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(MediaNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleMediaNotFound(
            MediaNotFoundException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    // Fallback (IMPORTANT)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        ex.printStackTrace(); // Temporary for debugging
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected server error. Please try again later.",
                request.getRequestURI()
        );
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            HttpStatus status,
            String message,
            String path
    ) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(),
                status.value(),
                status.name(),
                message,
                path
        );
        return new ResponseEntity<>(error, status);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
public ResponseEntity<ErrorResponse> handleMissingPart(
        MissingServletRequestPartException ex,
        HttpServletRequest request
) {
    return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Missing request part: " + ex.getRequestPartName(),
            request.getRequestURI()
    );
}

@ExceptionHandler(MultipartException.class)
public ResponseEntity<ErrorResponse> handleMultipartError(
        MultipartException ex,
        HttpServletRequest request
) {
    return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Invalid multipart request. Ensure file and JSON are sent correctly.",
            request.getRequestURI()
    );
}

@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidation(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
) {
    String message = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .findFirst()
            .orElse("Validation failed");

    return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            message,
            request.getRequestURI()
    );
}

}
