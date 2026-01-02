import React, { useState, useEffect } from 'react';
import api from '../api/client';
import useAuth from '../hooks/useAuth';
import DIDVerification from '../components/DIDVerification';
import './PerfilUsuario.css';

const PerfilUsuario = () => {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
            setLoading(false);
        } else {
            // If user data isn't in context, fetch it.
            api.get('/auth/me')
                .then(response => {
                    setUser(response.data);
                    setFormData({ name: response.data.name, email: response.data.email });
                })
                .catch(err => setError('Could not load user profile.'))
                .finally(() => setLoading(false));
        }
    }, [user, setUser]);

    const handleProfileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const response = await api.put('/auth/profile', formData);
            setUser(response.data.user);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            setError('New passwords do not match.');
            return;
        }
        try {
            await api.put('/auth/password', passwordData);
            setSuccess('Password changed successfully!');
            setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password.');
        }
    };

    if (loading) return <div className="perfil-container"><h2>Loading Profile...</h2></div>;

    return (
        <div className="perfil-container">
            <h1>User Profile</h1>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            
            <div className="form-section">
                <h2>Profile Information</h2>
                <form onSubmit={handleProfileSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleProfileChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleProfileChange} />
                    </div>
                    <button type="submit" className="btn-submit">Update Profile</button>
                </form>
            </div>

            <div className="form-section">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                        <label htmlFor="current_password">Current Password</label>
                        <input type="password" id="current_password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new_password">New Password</label>
                        <input type="password" id="new_password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new_password_confirmation">Confirm New Password</label>
                        <input type="password" id="new_password_confirmation" name="new_password_confirmation" value={passwordData.new_password_confirmation} onChange={handlePasswordChange} />
                    </div>
                    <button type="submit" className="btn-submit">Change Password</button>
                </form>
            </div>

            <DIDVerification />
        </div>
    );
};

export default PerfilUsuario;
