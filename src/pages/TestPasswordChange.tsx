import React, { useState, useEffect } from "react";
import { authUtils, useAuth } from "../contexts/AuthContext";
import { Key, CheckCircle, AlertCircle } from "lucide-react";

const TestPasswordChange: React.FC = () => {
  const { updateUserPassword, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await authUtils.getAllUsers();
    setUsers(allUsers.filter((u) => u.isActive));
  };

  const handlePasswordChange = async () => {
    setMessage("");

    if (!selectedUserId) {
      setMessage("Please select a user");
      setIsSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      setIsSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateUserPassword(selectedUserId, newPassword);
      if (success) {
        setMessage("✅ Password updated successfully! Old password no longer works.");
        setIsSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setSelectedUserId("");
        await loadUsers();
      } else {
        setMessage("❌ Failed to update password");
        setIsSuccess(false);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Only administrators can change passwords
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-full">
              <Key className="text-purple-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Change User Password
              </h1>
              <p className="text-sm text-gray-600">
                Admin can change password for any user
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                isSuccess
                  ? "bg-green-100 border border-green-400 text-green-700"
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}
            >
              {isSuccess ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={isLoading}
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter new password (min 6 characters)"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Confirm new password"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Key size={20} />
                  Change Password
                </>
              )}
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Select a user from the dropdown</li>
              <li>Enter a new password (minimum 6 characters)</li>
              <li>The old password will be completely removed</li>
              <li>User can login with the new password immediately</li>
              <li>The old password will no longer work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPasswordChange;