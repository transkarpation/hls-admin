"use client";

import { Card, CardContent, Typography, Button, Box, Chip } from "@mui/material";
import { Link } from "react-router-dom";
import { useWS } from "./WebSocketProvider";

export function Dashboard() {
  const { connected } = useWS();

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5">Welcome to HLS Admin</Typography>
          <Chip
            label={connected ? "WS Connected" : "WS Disconnected"}
            color={connected ? "success" : "error"}
            size="small"
            variant="outlined"
          />
        </Box>
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button variant="outlined" component={Link} to="/events">
            Events
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
