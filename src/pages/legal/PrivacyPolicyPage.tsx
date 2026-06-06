import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '"DM Sans", sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#4c1d95', letterSpacing: '-0.5px' }}>Acadera</div>
        <Link to="/" style={{ color: '#4c1d95', textDecoration: 'none', fontWeight: 600 }}>Back to Home</Link>
      </header>
      <main style={{ maxWidth: 800, margin: '60px auto', background: '#fff', padding: 60, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString()}</p>

        <div style={{ color: '#334155', lineHeight: 1.8, fontSize: 16 }}>
          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>1. Introduction</h2>
          <p>Welcome to Acadera. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our application.</p>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>2. The Data We Collect About You</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you, which we have grouped together as follows:</p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier, and date of birth.</li>
            <li><strong>Contact Data:</strong> includes billing address, email address and telephone numbers.</li>
            <li><strong>Educational Data:</strong> includes student records, attendance, grades, and disciplinary logs.</li>
            <li><strong>Financial Data:</strong> includes payment details, fee structures, and transaction history.</li>
          </ul>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>3. How We Use Your Personal Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>Where we need to perform the contract we are about to enter into or have entered into with your school.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>4. Data Security</h2>
          <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>5. Your Legal Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data. These include the right to:</p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
          </ul>
          
          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>6. Contact Us</h2>
          <p>If you have any questions about this privacy policy or our privacy practices, please contact our Data Protection Officer at privacy@acadera.com.</p>
        </div>
      </main>
      <footer style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 14 }}>
        &copy; {new Date().getFullYear()} Acadera. All rights reserved.
      </footer>
    </div>
  );
}
