import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '"DM Sans", sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#4c1d95', letterSpacing: '-0.5px' }}>Acadera</div>
        <Link to="/" style={{ color: '#4c1d95', textDecoration: 'none', fontWeight: 600 }}>Back to Home</Link>
      </header>
      <main style={{ maxWidth: 800, margin: '60px auto', background: '#fff', padding: 60, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>Terms of Service</h1>
        <p style={{ color: '#64748b', marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString()}</p>

        <div style={{ color: '#334155', lineHeight: 1.8, fontSize: 16 }}>
          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>1. Acceptance of Terms</h2>
          <p>By accessing and using the Acadera platform, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>2. Description of Service</h2>
          <p>Acadera provides a comprehensive school management system, including but not limited to student information systems, fee management, academic grading, and communication tools. We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice.</p>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>3. User Conduct</h2>
          <p>You agree to not use the service to:</p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>Upload, post, email or otherwise transmit any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable.</li>
            <li>Harm minors in any way.</li>
            <li>Impersonate any person or entity.</li>
            <li>Interfere with or disrupt the service or servers or networks connected to the service.</li>
          </ul>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>4. Payment Terms</h2>
          <p>If you use our fee management integration, you agree to our payment terms. Transaction fees, such as the standard payment processing commission, are deducted automatically from successful payments before settlement to the school's designated bank account. We do not store sensitive payment details on our servers.</p>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>5. Termination</h2>
          <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.</p>

          <h2 style={{ fontSize: 24, color: '#1e293b', marginTop: 40, marginBottom: 16 }}>6. Changes to Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
        </div>
      </main>
      <footer style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 14 }}>
        &copy; {new Date().getFullYear()} Acadera. All rights reserved.
      </footer>
    </div>
  );
}
