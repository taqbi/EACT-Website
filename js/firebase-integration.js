// Import the required Firebase V10 Modular SDKs directly from Google's CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl4G5X2xEfj09EWaHjEJxgzGi5y6gHzqI",
  authDomain: "eact-static-website.firebaseapp.com",
  projectId: "eact-static-website",
  storageBucket: "eact-static-website.firebasestorage.app",
  messagingSenderId: "288298301352",
  appId: "1:288298301352:web:afdf21475727c615da0f9d",
  measurementId: "G-HDWZNGX0P6"
};

// Initialize Firebase App and Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Generates a basic hash to identify unique submissions 
 * and prevent duplicate entries on accidental page refreshes.
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

/**
 * 1. Saves a mock test attempt to Firestore with full analytics.
 * Prevents duplicate submissions using localStorage.
 * 
 * @param {Object} attemptData - The detailed analytics of the attempt
 */
async function saveAttempt(attemptData) {
    try {
        // Prevent duplicate submission on page refresh
        const attemptFingerprint = simpleHash(`${attemptData.mockName}_${attemptData.score}_${attemptData.timeTaken}`);
        const submittedAttempts = JSON.parse(localStorage.getItem('submittedAttempts') || '[]');
        
        if (submittedAttempts.includes(attemptFingerprint)) {
            console.warn("Attempt already submitted. Duplicate prevented.");
            return { success: false, message: "Duplicate submission prevented." };
        }

        // Add document to 'attempts' collection in Firestore
        const docRef = await addDoc(collection(db, "attempts"), {
            studentName: attemptData.studentName || "Anonymous Student",
            email: attemptData.email || "Not Provided",
            mockName: attemptData.mockName || "Unknown Test",
            score: attemptData.score || 0,
            totalQuestions: attemptData.totalQuestions || 0,
            percentage: attemptData.percentage || 0,
            correctAnswers: attemptData.correctAnswers || 0,
            wrongAnswers: attemptData.wrongAnswers || 0,
            unansweredQuestions: attemptData.unansweredQuestions || 0,
            timeTaken: attemptData.timeTaken || 0, // Time in seconds
            timestamp: serverTimestamp(),
            answers: attemptData.answers || [] // Array of { questionText, selectedOption, correctOption, isCorrect }
        });

        // Save fingerprint to localStorage to prevent future duplicates
        submittedAttempts.push(attemptFingerprint);
        localStorage.setItem('submittedAttempts', JSON.stringify(submittedAttempts));

        // Optional: Save local session tracking for "My Performance" UI
        const sessionHistory = JSON.parse(localStorage.getItem('mockSessionHistory') || '[]');
        sessionHistory.push({ 
            ...attemptData, 
            id: docRef.id, 
            date: new Date().toISOString() 
        });
        localStorage.setItem('mockSessionHistory', JSON.stringify(sessionHistory));

        console.log("Attempt successfully written to Firestore with ID: ", docRef.id);
        return { success: true, id: docRef.id };
    } catch (e) {
        console.error("Error adding attempt document: ", e);
        return { success: false, error: e };
    }
}

/**
 * 2. Fetches analytics/statistics for a specific mock test.
 * 
 * @param {string} mockName - The name of the mock test
 */
async function fetchMockStats(mockName) {
    try {
        const q = query(collection(db, "attempts"), where("mockName", "==", mockName));
        const querySnapshot = await getDocs(q);
        
        let totalAttempts = 0;
        let totalScore = 0;
        let highestScore = -Infinity;
        let lowestScore = Infinity;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalAttempts++;
            totalScore += data.score;
            if (data.score > highestScore) highestScore = data.score;
            if (data.score < lowestScore) lowestScore = data.score;
        });

        if (totalAttempts === 0) {
            return { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 };
        }

        return {
            totalAttempts,
            averageScore: (totalScore / totalAttempts).toFixed(2),
            highestScore,
            lowestScore
        };
    } catch (e) {
        console.error("Error fetching stats: ", e);
        return null;
    }
}

/**
 * Fetches the exact rank of a given score by counting how many attempts 
 * have a higher score, or the same score but faster time.
 */
async function fetchExactRank(mockName, score, timeTaken) {
    try {
        const q = query(collection(db, "attempts"), where("mockName", "==", mockName));
        const querySnapshot = await getDocs(q);
        
        let rank = 1;
        let total = 0;
        
        querySnapshot.forEach((doc) => {
            total++;
            const data = doc.data();
            if (data.score > score) {
                rank++;
            } else if (data.score === score && data.timeTaken < timeTaken) {
                rank++;
            }
        });
        return { rank, total };
    } catch (e) {
        console.error("Error fetching exact rank: ", e);
        return { rank: "N/A", total: "N/A" };
    }
}

/**
 * 3. Fetches the top 10 leaderboard for a specific mock test.
 * 
 * @param {string} mockName - The name of the mock test
 */
async function fetchLeaderboard(mockName) {
    try {
        // Fetch all attempts for this test (Avoids needing a composite index in Firestore)
        const q = query(
            collection(db, "attempts"),
            where("mockName", "==", mockName)
        );
        
        const querySnapshot = await getDocs(q);
        const leaderboard = [];
        
        querySnapshot.forEach((doc) => {
            leaderboard.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort in memory: highest score first, then least time taken
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.timeTaken - b.timeTaken;
        });
        
        return leaderboard.slice(0, 10);
    } catch (e) {
        console.error("Error fetching leaderboard: ", e);
        return [];
    }
}

/**
 * 4. Fetches all attempts across all tests.
 */
async function fetchAllAttempts() {
    try {
        const q = query(collection(db, "attempts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const attempts = [];
        querySnapshot.forEach((doc) => {
            attempts.push({ id: doc.id, ...doc.data() });
        });
        
        return attempts;
    } catch (e) {
        console.error("Error fetching all attempts: ", e);
        return [];
    }
}

// Expose functions to the global window object so they can be accessed dynamically by your existing mock-test-logic.js
window.EACTFirebase = {
    saveAttempt,
    fetchMockStats,
    fetchLeaderboard,
    fetchAllAttempts,
    fetchExactRank
};