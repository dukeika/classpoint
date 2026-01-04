"use client";

import { useEffect, useState } from "react";
import { useStaffAuth } from "../../../components/staff-auth";

export default function ProfileEditPage() {
  const { session } = useStaffAuth();
  const details = session?.claims;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setName(details?.name || "");
    setEmail(details?.email || "");
    setPhone(details?.phone_number || "");
  }, [details?.name, details?.email, details?.phone_number]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Account</div>
          <h1>Edit profile</h1>
          <p className="muted">Update your contact details and preferences.</p>
        </div>
        <a className="button" href="/profile/security">
          Profile security
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Personal details</h3>
          <div className="form-grid">
            <input placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} />
            <input placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <select defaultValue="English">
              <option>English</option>
              <option>French</option>
            </select>
            <button className="button" type="button">
              Save changes
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Preferences</h3>
          <div className="list">
            <label className="line-item">
              <div>
                <strong>Weekly summary email</strong>
                <small>Receive a Monday summary of collections and attendance.</small>
              </div>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="line-item">
              <div>
                <strong>SMS alerts for payments</strong>
                <small>Get instant alerts when payments land.</small>
              </div>
              <input type="checkbox" defaultChecked />
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}

