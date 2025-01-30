import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Typography from '@mui/material/Typography';

import "./../styles/Mui-Override.scss";

export default function OrderStatusStepper({ orderStatus, timestamps }) {

  const steps = [
    {
      label: 'Order Diajukan',
      description: timestamps.timestampOrder ? timestamps.timestampOrder : '',
      isDisabled: timestamps.timestampOrder === 0
    },
    {
      label: 'Order Dikirim',
      description: timestamps.timestampShipped ? timestamps.timestampShipped : '',
      isDisabled: timestamps.timestampShipped === 0
    },
    {
      label: 'Order Selesai',
      description: timestamps.timestampComplete ? timestamps.timestampComplete : '',
      isDisabled: timestamps.timestampComplete === 0
    }
  ];

  const activeStep = parseInt(orderStatus);

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} completed={activeStep > index}>
            <StepLabel 
              className='customLabelStepper'
              TransitionProps={{ unmountOnExit: false }}
            >
              {step.label}
            </StepLabel>
            <StepContent 
              className='customDescStepper'
              TransitionProps={{ unmountOnExit: false }}
            >
              <Typography>
                {index === 0  || index === 1 ||index === activeStep ? step.description : ''}
              </Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}