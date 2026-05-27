"use client";

import { Card, CardContent, Typography, Button, Box } from "@mui/material";

export function Dashboard() {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Welcome to HLS Admin
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" href="/watch">
            Watch Lesson 10
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
