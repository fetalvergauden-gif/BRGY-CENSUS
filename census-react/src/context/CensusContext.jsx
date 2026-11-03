
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from 'react';

import { auth } from '../components/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { API_ENDPOINTS } from '../config/api';

// Centralized API endpoints
const API_URL = API_ENDPOINTS.census;
const ACTIVITY_LOGS_API = API_ENDPOINTS.activityLogs;
const AUTH_SYNC_API = API_ENDPOINTS.authSync;

const CensusContext = createContext(null);

export function CensusProvider({ children }) {
    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState('');
    const [logs, setLogs] = useState([]);
    const [userRole, setUserRole] = useState(null);

    // ==========================================
    // GET FIREBASE TOKEN
    // ==========================================

    async function getToken() {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('You must sign in first.');
        }

        return await user.getIdToken();
    }

    // ==========================================
    // API RESPONSE HANDLER
    // ==========================================

    async function getResponseData(response) {
        return await response.json().catch(() => ({}));
    }

    // ==========================================
    // LOAD ALL CENSUS RECORDS
    // ADMIN ONLY
    // ==========================================

    const refreshRecords = useCallback(async () => {
        if (!auth.currentUser) {
            setRecords([]);
            return [];
        }

        const token = await getToken();

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                data.message || 'Unable to refresh census records.'
            );
        }

        const updatedRecords = Array.isArray(data) ? data : [];

        setRecords(updatedRecords);

        return updatedRecords;
    }, []);

    // ==========================================
    // LOAD ACTIVITY LOGS
    // ADMIN ONLY
    // ==========================================

    const refreshLogs = useCallback(async () => {
        if (!auth.currentUser) {
            setLogs([]);
            return [];
        }

        try {
            const token = await getToken();

            const response = await fetch(ACTIVITY_LOGS_API, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await getResponseData(response);

            if (!response.ok) {
                throw new Error(
                    data.message || 'Unable to load activity logs.'
                );
            }

            const updatedLogs = Array.isArray(data) ? data : [];

            setLogs(updatedLogs);

            return updatedLogs;

        } catch (error) {
            console.error(
                'Could not load activity logs:',
                error
            );

            return [];
        }
    }, []);

    // ==========================================
    // AUTHENTICATION AND USER ROLE
    // ==========================================

    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (!user) {
                    setRecords([]);
                    setLogs([]);
                    setUserRole(null);
                    setRecordsLoading(false);
                    setRecordsError('');
                    return;
                }

                setRecordsLoading(true);
                setRecordsError('');

                try {
                    const token = await user.getIdToken();

                    // Sync Firebase user with MySQL users table.
                    const profileResponse = await fetch(
                        AUTH_SYNC_API,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                displayName: user.displayName || '',
                                email: user.email || ''
                            })
                        }
                    );

                    const profile = await getResponseData(
                        profileResponse
                    );

                    if (!profileResponse.ok) {
                        throw new Error(
                            profile.message ||
                            'Unable to sync user profile.'
                        );
                    }

                    const role = profile.role || 'user';

                    if (!active) return;

                    setUserRole(role);

                    // ==================================
                    // ADMIN
                    // ==================================

                    if (role === 'admin') {
                        const response = await fetch(API_URL, {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        const data = await getResponseData(response);

                        if (!response.ok) {
                            throw new Error(
                                data.message ||
                                'Unable to load census records.'
                            );
                        }

                        if (!active) return;

                        setRecords(
                            Array.isArray(data) ? data : []
                        );

                        // Admin can access activity logs.
                        const logResponse = await fetch(
                            ACTIVITY_LOGS_API,
                            {
                                method: 'GET',
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );

                        const logData = await getResponseData(
                            logResponse
                        );

                        if (active && logResponse.ok) {
                            setLogs(
                                Array.isArray(logData)
                                    ? logData
                                    : []
                            );
                        }
                    }

                    // ==================================
                    // REGULAR USER
                    // ==================================

                    else {
                        // Regular users must not download
                        // all household census records.
                        if (active) {
                            setRecords([]);
                            setLogs([]);
                        }
                    }

                } catch (error) {
                    console.error(
                        'Could not connect to Barangay Census API:',
                        error
                    );

                    if (active) {
                        setRecordsError(
                            error.message ||
                            'Unable to connect to the census server.'
                        );

                        setRecords([]);
                        setLogs([]);
                    }

                } finally {
                    if (active) {
                        setRecordsLoading(false);
                    }
                }
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    // ==========================================
    // ADD CENSUS RECORD
    // ADMIN AND REGULAR USERS
    // ==========================================

    async function addRecord(record) {
        const token = await getToken();

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(record)
        });

        const data = await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to save census record.'
            );
        }

        // Only admins should refresh these resources.
        if (userRole === 'admin') {
            await refreshRecords();
            await refreshLogs();
        }

        return data;
    }

    // ==========================================
    // UPDATE CENSUS RECORD
    // ADMIN ONLY
    // ==========================================

    async function updateRecord(id, changes) {
        const token = await getToken();

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(changes)
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to update census record.'
            );
        }

        if (userRole === 'admin') {
            await refreshRecords();
            await refreshLogs();
        }

        return data;
    }

    // ==========================================
    // DELETE ENTIRE HOUSEHOLD
    // ADMIN ONLY
    // ==========================================

    async function deleteRecord(id) {
        const token = await getToken();

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to delete census record.'
            );
        }

        if (userRole === 'admin') {
            await refreshRecords();
            await refreshLogs();
        }

        return data;
    }

    // ==========================================
    // DELETE ONE RESIDENT
    // ADMIN ONLY
    // ==========================================

    async function deleteResident(householdId, memberIndex) {
        if (
            householdId === undefined ||
            householdId === null ||
            householdId === ''
        ) {
            throw new Error('Household ID is missing.');
        }

        const index = Number(memberIndex);

        if (
            !Number.isInteger(index) ||
            index < 0
        ) {
            throw new Error('Invalid resident index.');
        }

        const token = await getToken();

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(householdId)}/residents/${index}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to delete resident.'
            );
        }

        if (userRole === 'admin') {
            await refreshRecords();
            await refreshLogs();
        }

        return data;
    }

    // ==========================================
    // ADD / REFRESH ACTIVITY LOGS
    // ==========================================

    function addLog() {
        if (userRole === 'admin') {
            return refreshLogs();
        }

        return Promise.resolve([]);
    }

    // ==========================================
    // CONTEXT PROVIDER
    // ==========================================

    return (
        <CensusContext.Provider
            value={{
                records,
                logs,

                recordsLoading,
                recordsError,

                userRole,

                addRecord,
                updateRecord,
                deleteRecord,
                deleteResident,

                addLog,

                refreshRecords,
                refreshLogs
            }}
        >
            {children}
        </CensusContext.Provider>
    );
}

// ==========================================
// CUSTOM CENSUS HOOK
// ==========================================

export function useCensus() {
    const context = useContext(CensusContext);

    if (!context) {
        throw new Error(
            'useCensus must be used inside CensusProvider.'
        );
    }

    return context;
}
