import { Box, Typography } from '@mui/material';

interface CPEmptyProps {
  text: string;
}

const CPEmpty: React.FC<CPEmptyProps> = ({ text }) => {
  return (
    <Box
      alignItems="center"
      display="flex"
      height="100" // Adjust this value as needed
      justifyContent="center"
    >
      <Typography variant="h6">
        {text}
      </Typography>
    </Box>
  );
}

export default CPEmpty;
