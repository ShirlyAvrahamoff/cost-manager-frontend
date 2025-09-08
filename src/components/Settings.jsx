// src/components/Settings.jsx
import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Stack, Alert } from '@mui/material';
import { getExchangeRatesUrl, setExchangeRatesUrl } from '../services/settings';

/**
 * Settings view for configuring the exchange-rates source URL.
 */
export default function Settings() {
    const [url, setUrl] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setUrl(getExchangeRatesUrl());
    }, []);

    const handleSave = () => {
        setSaved(false);
        setError('');

        // Basic URL validation using the URL API (enforces http/https)
        try {
            const parsed = new URL(url);
            if (!/^https?:$/.test(parsed.protocol)) {
                setError('Please provide a valid http(s) URL.');
                return;
            }
        } catch {
            setError('Please provide a valid http(s) URL.');
            return;
        }

        try {
            setExchangeRatesUrl(url);
            setSaved(true);
        } catch {
            setError('Failed to save the URL.');
        }
    };

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto', mt: 4, px: 2 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>Settings</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Set the URL that returns currency exchange rates as JSON in the format:
                        {' '}
                        {`{"USD":1,"GBP":1.8,"EURO":0.7,"ILS":3.4}`}
                    </Typography>

                    <Stack spacing={2}>
                        <TextField
                            label="Exchange Rates URL"
                            placeholder="https://example.com/rates.json"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            fullWidth
                        />
                        <Box>
                            <Button variant="contained" onClick={handleSave}>Save</Button>
                        </Box>

                        {saved && <Alert severity="success">URL saved.</Alert>}
                        {error && <Alert severity="error">{error}</Alert>}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
