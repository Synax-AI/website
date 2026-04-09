import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const API_URL = "https://synax-api-d0bzbgepd6gkcuf9.centralindia-01.azurewebsites.net/api/submit-founding-access";
const RECAPTCHA_SITE_KEY = "6LcUx64sAAAAACEcLsjrNUeiS3L6VgLbA4x1VAu9"; 

export default function WaitlistForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'duplicate'>('idle');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!captchaToken) {
      setStatus('error');
      setMessage('Please verify that you are not a robot.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string || 'name';
    const role = formData.get('role') as string || 'Unknown';

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sending the recaptcha token to backend as well to verify 
        body: JSON.stringify({ name, email, role, recaptcha: captchaToken }),
      });

      const result = await response.json();

      if (result.status === "duplicate") {
        setStatus('duplicate');
        setMessage(result.message);
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      } else if (result.status === "error") {
        setStatus('error');
        setMessage(result.message);
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      } else if (result.status === "success") {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message || 'Something went wrong. Please try again.');
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } catch (err) {
      console.error("Submission error", err);
      setStatus('error');
      setMessage('Network error. Please try again.');
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  const onCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    if (status === 'error' && message === 'Please verify that you are not a robot.') {
      setMessage('');
      setStatus('idle');
    }
  };

  return (
    <form className="obs-cta__form" onSubmit={handleSubmit}>
      <div className="obs-cta__form-row">
        <input
          type="text"
          className="input name1"
          name="name"
          placeholder="Your Name"
          required
          disabled={status === 'success'}
        />
        <input
          type="email"
          className="input email1"
          name="email"
          placeholder="Work Email"
          required
          disabled={status === 'success'}
          onChange={() => {
            if (status === 'duplicate' || status === 'error') {
              setStatus('idle');
              setMessage('');
            }
          }}
        />
      </div>

      <select defaultValue="" className="input role1" name="role" required disabled={status === 'success'}>
        <option value="" disabled>Your Role</option>
        <option>Equity Research Analyst</option>
        <option>Investor / Family Office</option>
        <option>Boutique Firm / Fund Manager</option>
        <option>Independent Researcher</option>
      </select>

      <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'center' }}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={onCaptchaChange}
          theme="dark"
        />
      </div>

      <button type="submit" className="btn-premium joinBetaButton1" disabled={status === 'submitting' || status === 'success'}>
        {status === 'submitting' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '12px' }}>
              <svg className="obs-spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
            </div>
            <span>Requesting...</span>
            <div></div>
          </div>
        ) : status === 'success' ? (
          "Access Requested ✓"
        ) : (
          "Apply for Founding Access →"
        )}
      </button>

      {message && (
        <p
          style={{
            display: 'block',
            color: status === 'success' ? '#10b981' : status === 'duplicate' ? '#facc15' : '#f87171',
            fontSize: '0.95rem',
            textAlign: 'center',
            margin: '8px 0 0 0',
            fontWeight: 600,
          }}
        >
          {message}
        </p>
      )}

      <p className="obs-cta__disclaimer">
        No payment required to apply. Billing only occurs if selected.
      </p>
    </form>
  );
}
