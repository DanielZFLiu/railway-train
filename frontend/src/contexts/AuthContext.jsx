import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const AuthContext = createContext(null);

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // on mount check if there's a token in localStorage and fetch user data
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${BACKEND_URL}/user/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error('Failed to fetch user data');
                    }
                    return res.json();
                })
                .then((data) => {
                    setUser(data.user);
                })
                .catch((err) => {
                    console.error('Error fetching user data:', err);
                    localStorage.removeItem('token');
                    setUser(null);
                });
        }
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            // handle error
            if (!res.ok) {
                const errorData = await res.json();
                return errorData.message;
            }

            const data = await res.json();
            localStorage.setItem('token', data.token);

            // fetch the user data 
            const userRes = await fetch(`${BACKEND_URL}/user/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`,
                },
            });

            if (userRes.ok) {
                const userData = await userRes.json();
                setUser(userData.user);
            }

            navigate('/profile');
        } catch (error) {
            console.error('Login error:', error);
            return 'An error occurred during login';
        }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async ({ username, firstname, lastname, password }) => {
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, firstname, lastname, password }),
            });

            // if error occurred, return error
            if (!res.ok) {
                const errorData = await res.json();
                return errorData.message;
            }

            // navigate success page
            navigate('/success');
        } catch (error) {
            console.error('Registration error:', error);
            return 'An error occurred during registration';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
