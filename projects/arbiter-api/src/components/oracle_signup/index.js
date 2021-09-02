import React from 'react'
import { StepOne } from './StepOne'
import { StepTwo } from './StepTwo'
import { StepThree } from './StepThree'
import { StepFour } from './StepFour'

const steps = 
    [
      {name: 'NodeInfo', component: <StepOne/>},
      {name: 'Address', component: <StepTwo/>},
      {name: 'Funding', component: <StepThree/>},
      {name: 'Deployment', component: <StepFour/>}
    ]

export { steps }