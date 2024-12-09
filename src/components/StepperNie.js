import { useState } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Typography from '@mui/material/Typography';

import "./../styles/Mui-Override.scss";

export default function NieStatusStepper({ nieStatus, timestamps }) {

  const steps = [
    {
      label: 'In Local Production',
      description: timestamps.timestampProduction ? timestamps.timestampProduction : '',
      isDisabled: timestamps.timestampProduction === 0
    },
    {
      label: 'NIE Requested',
      description: timestamps.timestampNieRequest ? timestamps.timestampNieRequest : '',
      isDisabled: timestamps.timestampNieRequest === 0
    },
    {
      label: 'NIE Approved',
      description: timestamps.timestampNieApprove ? timestamps.timestampNieApprove : '',
      isDisabled: timestamps.timestampNieApprove === 0
    }
  ];
  console.log(steps);

  const currentActiveStep = parseInt(nieStatus);

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Stepper activeStep={currentActiveStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} completed={currentActiveStep > index}>
            <StepLabel className='customLabelStepper' TransitionProps={{ unmountOnExit: false }}>
              {step.label}
            </StepLabel>
            <StepContent 
              className='customDescStepper'
              TransitionProps={{ unmountOnExit: false }}
            >
              <Typography>
                {index === 0  || index === 1 || index === currentActiveStep ? step.description : ''}
              </Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}