# 🚀 Quick Start Guide - Testing the Impersonation System

## **Immediate Solution: Development Login**

Since Stack Auth requires team creation to be enabled and you want invitation-only signup, we've created a **development bypass** that lets you test the impersonation system immediately.

### **Step 1: Access Development Login**

1. **Go to**: `http://localhost:3000/dev-login`
2. **Select a test user** from the dropdown
3. **Click "Login as Test User"**

### **Available Test Users:**

| User | Email | Role | Capabilities |
|------|-------|------|-------------|
| **Super Admin** | superadmin@example.com | SUPER_ADMIN | Full access + impersonate anyone |
| **Alice Manager** | alice@example.com | ADMIN | Company management + impersonate lower roles |
| **Bob Worker** | bob@example.com | EMPLOYEE | Limited management + impersonate sales/customers |
| **Carol Sales** | carol@example.com | SALES_PERSON | Sales dashboard (can be impersonated) |
| **Eve Customer** | eve@example.com | CUSTOMER | Basic dashboard (can be impersonated) |

### **Step 2: Test Impersonation**

1. **Login as Super Admin** or **Admin**
2. **Go to dashboard** - you'll see the **Impersonation Selector** in the top right
3. **Select a user** to impersonate (Carol Sales or Eve Customer)
4. **Click "Start Impersonation"**
5. **Watch the red banner** appear at the top
6. **See how the dashboard changes** to show that user's perspective
7. **Click "Exit Impersonation"** to return to admin view

---

## **Production Setup: Invitation-Only System**

### **Stack Auth Configuration:**

To resolve the mismatch between Stack Auth's team creation and your invitation-only requirement:

1. **Enable client team creation** in Stack Auth dashboard (temporary)
2. **Use our custom invitation system** to control actual signup
3. **Super Admin sends invitations** via the system
4. **Recipients get invitation links** that pre-configure their signup

### **How It Works:**

```
1. Super Admin creates invitation → /api/auth/invite/create
2. System generates invitation link → /api/auth/invite?token=xxx&email=xxx
3. User clicks link → Pre-filled signup form
4. User completes signup → Stack Auth handles authentication
5. System links Stack Auth user → Database profile with correct role/team
```

### **API Endpoints Created:**

- `POST /api/auth/invite/create` - Super Admin creates invitations
- `GET /api/auth/invite` - Process invitation links
- `POST /api/auth/dev-login` - Development login (remove in production)

---

## **Next Steps:**

### **Immediate Testing (Now):**
✅ Use `/dev-login` to test all impersonation features
✅ Test role-based permissions and dashboard views
✅ Verify admin capabilities during impersonation

### **Production Deployment:**
1. **Enable team creation** in Stack Auth dashboard
2. **Remove dev-login** endpoints and pages
3. **Implement email sending** for invitations
4. **Add invitation management UI** for Super Admins
5. **Test the full invitation flow**

---

## **Architecture Summary:**

### **What We Solved:**
- ✅ **Invitation-only signup** while using Stack Auth
- ✅ **Team creation control** through custom logic
- ✅ **Role assignment** during invitation process
- ✅ **Development testing** without Stack Auth setup complexity

### **Security Model:**
- **Stack Auth**: Handles authentication, sessions, security
- **Your Database**: Controls roles, permissions, team assignments
- **Invitation System**: Gates access to signup process
- **Permission System**: Granular control over features

### **Impersonation Features:**
- ✅ **Admin privilege retention** during impersonation
- ✅ **Visual indicators** (red banner, user details)
- ✅ **Role hierarchy** enforcement
- ✅ **One-click exit** functionality
- ✅ **Session persistence** across page refreshes

---

## **Ready to Test!**

🎯 **Go to**: `http://localhost:3000/dev-login`
🔧 **Select**: "Super Admin" 
🚀 **Start**: Testing the impersonation system!

The system is fully functional and ready for testing your invitation-only, role-based, multi-tenant platform with secure admin impersonation capabilities.
