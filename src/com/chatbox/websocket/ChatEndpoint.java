package com.chatbox.websocket;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import javax.websocket.CloseReason;

@ServerEndpoint("/chat/{roomId}/{userId}/{role}/{password}")
public class ChatEndpoint {

    // Map Room ID -> Set of Sessions
    private static Map<String, Set<Session>> roomSessions = new ConcurrentHashMap<>();
    
    // Map Room ID -> List of Message JSONs (Chat History)
    private static Map<String, List<String>> roomHistory = new ConcurrentHashMap<>();
    
    // Map Room ID -> Room Password
    private static Map<String, String> roomPasswords = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("roomId") String roomId, @PathParam("userId") String userId, @PathParam("role") String role, @PathParam("password") String password) throws IOException {
        
        if ("admin".equals(role)) {
            // Admin creates the room and sets the password
            roomPasswords.put(roomId, password);
        } else {
            // Student joining: Validate Room and Password
            if (!roomPasswords.containsKey(roomId)) {
                session.close(new CloseReason(CloseReason.CloseCodes.CANNOT_ACCEPT, "ROOM_NOT_FOUND"));
                return;
            }
            if (!roomPasswords.get(roomId).equals(password)) {
                session.close(new CloseReason(CloseReason.CloseCodes.CANNOT_ACCEPT, "INVALID_PASSWORD"));
                return;
            }
        }
        
        roomSessions.putIfAbsent(roomId, Collections.synchronizedSet(new HashSet<>()));
        roomSessions.get(roomId).add(session);
        
        session.getUserProperties().put("roomId", roomId);
        session.getUserProperties().put("userId", userId);
        session.getUserProperties().put("role", role);
        
        System.out.println("User joined: " + userId + " Role: " + role + " Room: " + roomId);
        
        // Initialize history list for the room if it doesn't exist
        roomHistory.putIfAbsent(roomId, Collections.synchronizedList(new ArrayList<>()));
        
        // Notify client of successful authentication so frontend can redirect securely
        try {
            session.getBasicRemote().sendText("{\"type\":\"auth_success\"}");
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        // Send all previous messages to the newly joined user
        List<String> history = roomHistory.get(roomId);
        synchronized (history) {
            for (String pastMessage : history) {
                try {
                    session.getBasicRemote().sendText(pastMessage);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        String roomId = (String) session.getUserProperties().get("roomId");
        
        // Check if admin is closing the room
        if (message.contains("\"type\":\"close_room\"") || message.contains("\"type\": \"close_room\"")) {
            roomPasswords.remove(roomId);
            roomHistory.remove(roomId);
            Set<Session> sessions = roomSessions.remove(roomId);
            if (sessions != null) {
                for (Session s : sessions) {
                    if (s.isOpen()) {
                        try {
                            s.close(new CloseReason(CloseReason.CloseCodes.NORMAL_CLOSURE, "ROOM_CLOSED"));
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
            return;
        }

        // Save message to room history
        if (roomHistory.containsKey(roomId)) {
            roomHistory.get(roomId).add(message);
        }
        
        // Broadcast the message to all clients in the same room
        Set<Session> sessions = roomSessions.get(roomId);
        if (sessions != null) {
            for (Session s : sessions) {
                if (s.isOpen()) {
                    try {
                        s.getBasicRemote().sendText(message);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    @OnClose
    public void onClose(Session session) {
        String roomId = (String) session.getUserProperties().get("roomId");
        if (roomId != null && roomSessions.containsKey(roomId)) {
            roomSessions.get(roomId).remove(session);
        }
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        throwable.printStackTrace();
    }
}
