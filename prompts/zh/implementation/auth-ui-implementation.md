# @linch-kit/auth-ui Implementation Prompts

## 🎯 Implementation Overview

Create a comprehensive React UI component library for authentication and authorization that integrates with `@linch-kit/auth-core` and popular auth providers like NextAuth.js.

## 📋 Implementation Checklist

### Phase 1: Package Setup (30 minutes)
- [ ] Create package structure
- [ ] Configure build system and TypeScript
- [ ] Setup peer dependencies
- [ ] Create package.json with proper exports

### Phase 2: Core Auth Components (3-4 hours)
- [ ] AuthProvider context component
- [ ] LoginForm with multiple providers
- [ ] RegisterForm with multi-step flow
- [ ] AuthGuard for route protection
- [ ] LogoutButton component

### Phase 3: User Management (2-3 hours)
- [ ] UserProfile component
- [ ] PasswordChange component
- [ ] TwoFactorSetup component
- [ ] SessionManager component

### Phase 4: Permission Gates (1-2 hours)
- [ ] PermissionGate component
- [ ] RoleGate component
- [ ] OwnershipGate component

### Phase 5: Admin Components (2-3 hours)
- [ ] UserManager admin interface
- [ ] RoleManager component
- [ ] PermissionMatrix component

## 🚀 Step-by-Step Implementation

### Step 1: Package Initialization

**Prompt for package.json creation:**
```
Create a package.json for @linch-kit/auth-ui with the following requirements:
- Version: 0.1.0
- Description: "React UI components for authentication and authorization in Linch Kit"
- Main exports: dist/index.js, dist/index.mjs, dist/index.d.ts
- Dependencies: @linch-kit/auth-core, @linch-kit/schema, react, react-dom
- PeerDependencies: react ^18.0.0, react-dom ^18.0.0, next-auth ^4.0.0 (optional)
- DevDependencies: @types/react, @types/react-dom, typescript, tsup
- Scripts: build, type-check, lint, test, storybook
- Keywords: auth, authentication, authorization, ui, react, nextauth, linch-kit
```

### Step 2: Core AuthProvider

**Prompt for AuthProvider implementation:**
```
Create a comprehensive AuthProvider component (src/components/auth/AuthProvider.tsx) that:

1. Integrates with multiple auth providers (NextAuth.js, Auth0, custom)
2. Provides authentication state to child components
3. Handles session management and token refresh
4. Manages loading states and error handling
5. Provides auth context with hooks

Features to implement:
- Multi-provider support (NextAuth, Auth0, custom)
- Session state management
- Token refresh handling
- Loading and error states
- User profile management
- Permission integration
- Event handling (login, logout, session change)

Context should provide:
- user: Current user object
- session: Session information
- loading: Loading state
- error: Error state
- login: Login function
- logout: Logout function
- register: Registration function
- hasPermission: Permission checking function
- hasRole: Role checking function

TypeScript requirements:
- Generic user type support
- Provider-specific configuration types
- Session type definitions
- Error type definitions

Example usage:
```tsx
<AuthProvider provider="nextauth" config={authConfig}>
  <App />
</AuthProvider>
```
```

### Step 3: LoginForm Component

**Prompt for LoginForm implementation:**
```
Create a flexible LoginForm component (src/components/auth/LoginForm.tsx) that:

1. Supports multiple authentication providers
2. Handles credentials, OAuth, and magic link authentication
3. Includes form validation and error handling
4. Supports custom branding and theming
5. Provides responsive design
6. Includes accessibility features

Features to implement:
- Credentials login (email/password)
- OAuth provider buttons (Google, GitHub, etc.)
- Magic link authentication
- Form validation with error display
- Loading states during authentication
- Remember me functionality
- Forgot password link
- Registration link
- Custom field support
- Branding customization

Provider integrations:
- NextAuth.js signIn integration
- Auth0 login integration
- Custom authentication handlers
- Social provider buttons
- Enterprise SSO support

Form features:
- Email/password validation
- Password strength indicator
- Show/hide password toggle
- Auto-focus and keyboard navigation
- Form submission handling
- Error message display
- Success redirects

TypeScript requirements:
- Provider configuration types
- Form data types
- Validation error types
- Event handler types

Example usage:
```tsx
<LoginForm
  providers={['credentials', 'google', 'github']}
  onSuccess={(user) => router.push('/dashboard')}
  onError={(error) => showError(error.message)}
  redirectTo="/dashboard"
  showRegisterLink={true}
/>
```
```

### Step 4: RegisterForm Component

**Prompt for RegisterForm implementation:**
```
Create a multi-step RegisterForm component (src/components/auth/RegisterForm.tsx) that:

1. Supports multi-step registration flow
2. Includes email verification step
3. Handles profile setup
4. Integrates with validation schemas
5. Supports custom registration fields
6. Includes terms and privacy acceptance

Features to implement:
- Multi-step wizard interface
- Email verification flow
- Password confirmation
- Profile information collection
- Terms of service acceptance
- Email verification handling
- Custom field support
- Progress indicator
- Step navigation (next, back, skip)

Registration steps:
1. Basic information (email, password)
2. Email verification
3. Profile setup (name, avatar, preferences)
4. Terms acceptance
5. Welcome/completion

Validation features:
- Real-time field validation
- Password strength checking
- Email format validation
- Custom validation rules
- Server-side validation integration
- Error handling and display

TypeScript requirements:
- Step configuration types
- Form data types for each step
- Validation schema types
- Progress state types

Example usage:
```tsx
<RegisterForm
  steps={[
    { component: BasicInfo, fields: ['email', 'password'] },
    { component: EmailVerification, type: 'verification' },
    { component: ProfileSetup, fields: ['name', 'avatar'] }
  ]}
  onComplete={(user) => router.push('/welcome')}
  onStepChange={(step) => trackRegistrationStep(step)}
/>
```
```

### Step 5: AuthGuard Component

**Prompt for AuthGuard implementation:**
```
Create a flexible AuthGuard component (src/components/auth/AuthGuard.tsx) that:

1. Protects routes based on authentication status
2. Supports permission and role-based access control
3. Handles loading states during auth checks
4. Provides fallback components for unauthorized access
5. Supports different protection modes

Features to implement:
- Authentication requirement checking
- Permission-based access control
- Role-based access control
- Loading state handling
- Unauthorized access handling
- Redirect functionality
- Fallback component rendering
- Multiple protection modes

Protection modes:
- 'redirect': Redirect to login page
- 'hide': Hide content completely
- 'disable': Show disabled content
- 'fallback': Show custom fallback component

Access control features:
- Require authentication
- Require specific permissions
- Require specific roles
- Require resource ownership
- Custom access control functions
- Hierarchical permission checking

TypeScript requirements:
- Permission type definitions
- Role type definitions
- Guard configuration types
- Fallback component types

Example usage:
```tsx
<AuthGuard
  requireAuth={true}
  permissions={['users.read']}
  roles={['admin', 'moderator']}
  fallback={<UnauthorizedMessage />}
  redirectTo="/login"
  mode="redirect"
>
  <AdminPanel />
</AuthGuard>
```
```

### Step 6: Permission Gates

**Prompt for permission gate components:**
```
Create permission gate components in src/components/gates/ that provide fine-grained access control:

1. PermissionGate: Controls access based on permissions
2. RoleGate: Controls access based on user roles
3. OwnershipGate: Controls access based on resource ownership

PermissionGate features:
- Single or multiple permission checking
- 'all' or 'any' permission modes
- Permission hierarchy support
- Dynamic permission evaluation
- Fallback content rendering
- Loading state handling

RoleGate features:
- Single or multiple role checking
- Role hierarchy support
- Role inheritance checking
- Dynamic role evaluation
- Fallback content rendering

OwnershipGate features:
- Resource ownership checking
- User ID comparison
- Custom ownership functions
- Resource loading handling
- Ownership validation

TypeScript requirements:
- Permission type definitions
- Role type definitions
- Ownership check types
- Gate configuration types

Example usage:
```tsx
<PermissionGate permissions="users.manage" mode="any">
  <UserManagementButton />
</PermissionGate>

<RoleGate roles={['admin', 'moderator']}>
  <AdminTools />
</RoleGate>

<OwnershipGate resource="post" resourceId={postId} userId={currentUser.id}>
  <EditPostButton />
</OwnershipGate>
```
```

### Step 7: User Profile Components

**Prompt for user profile components:**
```
Create user profile management components in src/components/profile/:

1. UserProfile: Main profile management interface
2. ProfileForm: Editable profile form
3. PasswordChange: Password change form
4. TwoFactorSetup: 2FA configuration
5. SessionManager: Active session management

UserProfile features:
- Tabbed interface for different sections
- Profile information display
- Security settings
- Preferences management
- Account actions
- Avatar upload
- Profile completion indicator

ProfileForm features:
- Editable profile fields
- Avatar upload with preview
- Form validation
- Save/cancel actions
- Dirty state tracking
- Auto-save functionality
- Field-level permissions

PasswordChange features:
- Current password verification
- New password validation
- Password strength indicator
- Confirmation field
- Security requirements display
- Success/error handling

TwoFactorSetup features:
- TOTP setup with QR code
- SMS setup
- Email backup codes
- Recovery codes generation
- Method selection
- Verification flow

SessionManager features:
- Active session list
- Device information display
- Session termination
- Current session highlighting
- Security alerts
- Location information

TypeScript requirements:
- User profile types
- Form data types
- Security setting types
- Session information types
```

### Step 8: Admin Components

**Prompt for admin components implementation:**
```
Create administrative components in src/components/admin/:

1. UserManager: Complete user administration interface
2. RoleManager: Role and permission management
3. PermissionMatrix: Visual permission management

UserManager features:
- User list with search and filtering
- User creation and editing
- Role assignment
- Account status management
- Bulk operations
- User impersonation
- Activity monitoring
- Export functionality

RoleManager features:
- Role list and management
- Permission assignment
- Role hierarchy management
- Role templates
- Permission inheritance
- Role duplication
- Usage statistics

PermissionMatrix features:
- Visual permission grid
- Role vs permission matrix
- Bulk permission assignment
- Permission inheritance display
- Search and filtering
- Export/import functionality
- Permission templates

Integration requirements:
- CRUD operations integration
- Permission checking
- Real-time updates
- Audit logging
- Error handling
- Loading states

TypeScript requirements:
- Admin interface types
- User management types
- Role management types
- Permission matrix types
```

### Step 9: React Hooks

**Prompt for React hooks implementation:**
```
Create React hooks in src/hooks/ for authentication functionality:

1. useAuth(): Main authentication hook
2. usePermissions(): Permission checking hook
3. useProfile(): User profile management hook
4. useSession(): Session management hook
5. useAuthForm(): Form handling for auth forms

useAuth() features:
- Current user state
- Authentication status
- Login/logout functions
- Registration functions
- Loading and error states
- Session refresh
- Provider-specific methods

usePermissions() features:
- Permission checking functions
- Role checking functions
- Ownership checking functions
- Permission caching
- Dynamic permission evaluation
- Permission hierarchy support

useProfile() features:
- Profile data management
- Profile update functions
- Avatar upload handling
- Preference management
- Profile validation
- Auto-save functionality

useSession() features:
- Session information
- Session management
- Token refresh handling
- Session expiry warnings
- Multi-session handling
- Security monitoring

useAuthForm() features:
- Form state management
- Validation handling
- Submission handling
- Error management
- Loading states
- Field-level validation

TypeScript requirements:
- Hook return types
- Parameter types
- State types
- Error types
```

### Step 10: Styling and Theming

**Prompt for styling system:**
```
Create a comprehensive styling system in src/styles/:

1. Authentication-specific theme variables
2. Component styling with CSS modules or styled-components
3. Responsive design for all screen sizes
4. Dark mode support
5. Brand customization support

Theme features:
- Authentication color palette
- Form styling variables
- Button and input themes
- Modal and overlay styling
- Brand color integration
- Logo and imagery support

Responsive design:
- Mobile-first approach
- Touch-friendly controls
- Adaptive layouts
- Progressive enhancement
- Accessibility compliance

Customization support:
- CSS custom properties
- Theme provider integration
- Brand color overrides
- Logo customization
- Layout customization
```

## 🎯 Success Criteria

### Functional Requirements
- [ ] All authentication flows work correctly
- [ ] Permission system integration works
- [ ] Multi-provider support works
- [ ] Form validation works properly
- [ ] Session management works
- [ ] Admin interfaces function correctly

### Security Requirements
- [ ] No sensitive data in client-side storage
- [ ] Proper CSRF protection
- [ ] Secure password handling
- [ ] Session security measures
- [ ] Permission boundary enforcement

### Performance Requirements
- [ ] Bundle size < 40kb gzipped
- [ ] Authentication flows < 200ms
- [ ] Form validation < 50ms
- [ ] No memory leaks

### Quality Requirements
- [ ] TypeScript strict mode passes
- [ ] Security audit passes
- [ ] Accessibility tests pass
- [ ] All tests pass with >90% coverage

This implementation plan provides a complete roadmap for building a secure, user-friendly authentication UI library.
