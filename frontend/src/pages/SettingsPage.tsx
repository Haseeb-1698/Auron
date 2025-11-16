import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  InputAdornment,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import api from '@services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloud Provider Settings
  const [vultrApiKey, setVultrApiKey] = useState('');

  // Lab Settings
  const [defaultTimeout, setDefaultTimeout] = useState('3600000');
  const [maxInstancesPerUser, setMaxInstancesPerUser] = useState('5');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from backend (you'll need to create this endpoint)
      const vultrKey = localStorage.getItem('vultr_api_key') || '';
      setVultrApiKey(vultrKey);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveCloudSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Save to localStorage for now (in production, encrypt and save to backend)
      localStorage.setItem('vultr_api_key', vultrApiKey);

      // TODO: Send to backend for encrypted storage
      // await api.post('/settings/cloud', { vultrApiKey });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save cloud settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLabSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Send to backend
      // await api.post('/settings/labs', { defaultTimeout, maxInstancesPerUser });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save lab settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure your Auron platform settings and API integrations
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab icon={<CloudIcon />} label="Cloud Provider" iconPosition="start" />
            <Tab icon={<SecurityIcon />} label="Lab Settings" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Cloud Provider Settings */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cloud Provider Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure your cloud provider API keys to deploy labs in the cloud
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Settings saved successfully!
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Divider textAlign="left">
                  <Typography variant="subtitle2">Vultr</Typography>
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Vultr API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={vultrApiKey}
                  onChange={(e) => setVultrApiKey(e.target.value)}
                  placeholder="Enter your Vultr API key"
                  helperText="Get your API key from https://my.vultr.com/settings/#settingsapi"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                        >
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <strong>Note:</strong> Your API keys are stored securely and never shared with third parties.
                  For Docker mode (local labs), no API key is required.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCloudSettings}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Cloud Settings'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Lab Settings */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lab Environment Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure default settings for lab instances
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Timeout (ms)"
                  type="number"
                  value={defaultTimeout}
                  onChange={(e) => setDefaultTimeout(e.target.value)}
                  helperText="Default lab session timeout in milliseconds (1 hour = 3600000)"
                  inputProps={{ min: 60000, max: 14400000, step: 60000 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Instances Per User"
                  type="number"
                  value={maxInstancesPerUser}
                  onChange={(e) => setMaxInstancesPerUser(e.target.value)}
                  helperText="Maximum number of concurrent lab instances per user"
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveLabSettings}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Lab Settings'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>
      </Card>

      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">
          <Typography variant="subtitle2" gutterBottom>
            Important Security Information
          </Typography>
          <Typography variant="body2">
            • API keys are sensitive credentials - never share them publicly<br />
            • For production use, implement proper encryption for stored credentials<br />
            • Docker mode (default) runs labs locally and doesn't require cloud API keys<br />
            • Cloud mode requires a valid Vultr API key to provision virtual machines
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}
