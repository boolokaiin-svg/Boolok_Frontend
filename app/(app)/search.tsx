import React from 'react';
import { Redirect } from 'expo-router';

// Keep older links usable after removing the AI Search feature.
export default function RemovedSearchScreen() {
  return <Redirect href="/(app)/feed" />;
}
