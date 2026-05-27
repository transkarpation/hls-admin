"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { Title } from "react-admin";
import { onWSEvent, getEventHistory, type EventEntry } from "@/lib/wsEventBus";

export function EventsPage() {
  const [type, setType] = useState("");
  const [message, setMessage] = useState('{"key": "value"}');
  const [sending, setSending] = useState(false);
  const [events, setEvents] = useState<EventEntry[]>(getEventHistory);

  useEffect(() => {
    return onWSEvent(() => {
      setEvents([...getEventHistory()]);
    });
  }, []);

  const handleSend = async () => {
    if (!type) return;
    setSending(true);

    let data: Record<string, unknown> = {};
    if (message) {
      try {
        data = JSON.parse(message);
      } catch {
        data = { message };
      }
    }

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data, adminsOnly: true }),
    });

    setSending(false);
    setType("");
    setMessage("");
  };

  return (
    <Box sx={{ maxWidth: 800, mt: 2 }}>
      <Title title="Events" />
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Broadcast Event
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Event Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              size="small"
              placeholder="e.g. notification"
              sx={{ width: 200 }}
            />
            <TextField
              label="Message / JSON Data"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              size="small"
              fullWidth
              placeholder='e.g. Hello! or {"key": "value"}'
            />
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSend}
              disabled={!type || sending}
            >
              Send
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Live Feed
          </Typography>
          {events.length === 0 ? (
            <Typography color="text.secondary">
              No events yet. Events will appear here in real time.
            </Typography>
          ) : (
            <List dense>
              {events.map((evt, i) => (
                <Box key={i}>
                  {i > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip label={evt.type} size="small" color="primary" />
                          <Typography variant="caption" color="text.secondary">
                            {evt.timestamp}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{ mt: 0.5, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12 }}
                        >
                          {JSON.stringify(evt.data, null, 2)}
                        </Typography>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
