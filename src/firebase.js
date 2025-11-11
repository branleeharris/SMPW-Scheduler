// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';

// Your web app's Firebase configuration
// Replace this with your actual Firebase config from the Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyB2ib6cbpZqKdzpV1u29ufwW6LP6WKCIM0",
    authDomain: "smpw-scheduler.firebaseapp.com",
    databaseURL: "https://smpw-scheduler-default-rtdb.firebaseio.com",
    projectId: "smpw-scheduler",
    storageBucket: "smpw-scheduler.firebasestorage.app",
    messagingSenderId: "63865854922",
    appId: "1:63865854922:web:8cc29281307916064d8d33",
    measurementId: "G-4F80D7NWT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to increment the counter
export const incrementScheduleCounter = async () => {
  try {
    const counterRef = ref(database, 'schedulesGenerated');
    const snapshot = await get(counterRef);
    const currentCount = snapshot.exists() ? snapshot.val() : 0;
    await set(counterRef, currentCount + 1);
    console.log('Counter incremented to', currentCount + 1);
    return currentCount + 1;
  } catch (error) {
    console.error('Error incrementing counter:', error);
    return null;
  }
};

// Function to get the current count
export const getScheduleCount = (callback) => {
  const counterRef = ref(database, 'schedulesGenerated');
  onValue(counterRef, (snapshot) => {
    const count = snapshot.exists() ? snapshot.val() : 0;
    console.log('Fetched count:', count);
    callback(count);
  });
};