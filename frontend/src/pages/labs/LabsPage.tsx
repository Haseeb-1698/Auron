import { Box } from '@mui/material';
import { LabList } from '@components/labs';

export default function LabsPage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <LabList />
    </Box>
  );
}
