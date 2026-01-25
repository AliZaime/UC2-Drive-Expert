# 🔌 Frontend-Backend Integration Plan (Auto-UC2)

> **Context**: You have a robust React/Vite Frontend (`auto-uc2-enterprise (2)`) and a fully tested Express Backend.
> **Goal**: Wire them together so the Frontend displays real data.

---

## 🛠️ Step 1: Environment Configuration

The frontend needs to know where the backend lives.

1.  **Create Environment File**:
    - Create a file named `.env` inside `auto-uc2-enterprise (2)/`.
    - Add the following content:
      ```env
      VITE_API_URL=http://localhost:5000/api/v1
      ```

2.  **CORS & Proxy (Development)**:
    - To avoid Cross-Origin errors during local dev, update `vite.config.ts`:

      ```typescript
      import { defineConfig } from "vite";
      import react from "@vitejs/plugin-react";

      export default defineConfig({
        plugins: [react()],
        server: {
          proxy: {
            "/api": {
              target: "http://localhost:5000",
              changeOrigin: true,
              secure: false,
            },
          },
        },
      });
      ```

    - _Note_: If using the proxy, change `.env` to `VITE_API_URL=/api/v1`.

---

## 🔐 Step 2: Authentication Wiring

Connect the shiny Login UI to the real `authRoutes`.

1.  **Update `api.ts`**:
    - Ensure the token storage key matches exactly what you use. You use `auto_uc2_token`.
    - The backend returns `token` in the body. Ensure the login response parser captures it.

2.  **Modify `pages/Auth.tsx`**:
    - **Login Function**:
      ```typescript
      // Inside handleLoginSubmit
      try {
        const response = await api.post("/auth/login", { email, password });
        const { token, data } = response; // Backend returns { status: 'success', token, data: { user } }

        localStorage.setItem("auto_uc2_token", token);
        onLogin(data.user); // Update App state
      } catch (err) {
        setError("Invalid credentials");
      }
      ```
    - **Register Function**:
      - Map form fields to Backend Schema: `name`, `email`, `password`, `confirmPassword`.

---

## 📊 Step 3: Core Feature Wiring

Map the "Mock Data" in components to real API calls.

### 🚗 A. Vehicles Page (`pages/Vehicles.tsx`)

- **Current State**: Likely uses hardcoded arrays or `constants.tsx`.
- **Change**: Use `useEffect` to fetch data.
  ```typescript
  useEffect(() => {
    api.get("/public/browse").then((res) => setVehicles(res.data.vehicles));
  }, []);
  ```
- **Type Mapping**:
  - Frontend `id` -> Backend `_id`.
  - Frontend `image` -> Backend `images[0]`.

### 📝 B. Negotiations (`pages/Negotiations.tsx`)

- **Endpoint**: `GET /my/negotiations` (Client) or `/manager/negotiations` (Manager).
- **Action**: Wire the "Send Message" button to `POST /negotiations/:id/messages`.

### 📈 C. Dashboard (`pages/Dashboard.tsx`)

- **Endpoint**: `GET /manager/analytics` or `/my/dashboard`.
- **Charts**: Feed the `recharts` components with real data from `res.data`.

---

## 🚦 Step 4: Execution Checklist

- [ ] **Install Dependencies**: Run `npm install` in `auto-uc2-enterprise (2)`.
- [ ] **Start Backend**: Run `npm start` in `UC2` (root).
- [ ] **Start Frontend**: Run `npm run dev` in `auto-uc2-enterprise (2)`.
- [ ] **Test Login**: Try logging in with a user created via Postman/Tests.
- [ ] **Verify Token**: Check DevTools -> Application -> Local Storage.

---

**Ready to execute?** I can start applying these changes for you now.
