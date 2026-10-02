import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";


/*
|--------------------------------------------------------------------------
| API Configuration
|--------------------------------------------------------------------------
*/

const API_URL =
  "https://mern-auth-7mpp.onrender.com/api" ||
  "http://localhost:4000/api";


/*
|--------------------------------------------------------------------------
| Fetch Helper
|--------------------------------------------------------------------------
|
| credentials: "include" ensures the eld_auth HTTP-only cookie
| is sent with every authentication request.
|
*/

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },

      ...options,
    }
  );

  // Some endpoints may return 204 No Content.
  if (response.status === 204) {
    return null;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}


/*
|--------------------------------------------------------------------------
| Restore Existing Session
|--------------------------------------------------------------------------
|
| Called when the application starts.
|
| Browser refresh:
|
| Redux resets
|     ↓
| restoreSession()
|     ↓
| GET /auth/me/
|     ↓
| Browser sends eld_auth cookie
|     ↓
| Backend verifies JWT
|     ↓
| User restored into Redux
|
*/

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",

  async (_, { rejectWithValue }) => {
    try {
      return await request("/auth/me/");
    } catch (error) {
      return rejectWithValue(
        error.message ||
          "Session not found."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const signIn = createAsyncThunk(
  "auth/signIn",

  async (credentials, { rejectWithValue }) => {
    try {
      return await request(
        "/auth/signin/",
        {
          method: "POST",

          body: JSON.stringify(
            credentials
          ),
        }
      );
    } catch (error) {
      return rejectWithValue(
        error.message ||
          "Login failed."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

export const signUp = createAsyncThunk(
  "auth/signUp",

  async (credentials, { rejectWithValue }) => {
    try {
      return await request(
        "/auth/signup/",
        {
          method: "POST",

          body: JSON.stringify(
            credentials
          ),
        }
      );
    } catch (error) {
      return rejectWithValue(
        error.message ||
          "Registration failed."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const signOut = createAsyncThunk(
  "auth/signOut",

  async (_, { rejectWithValue }) => {
    try {
      await request(
        "/auth/logout/",
        {
          method: "POST",
        }
      );

      return true;
    } catch (error) {
      return rejectWithValue(
        error.message ||
          "Logout failed."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Auth Slice
|--------------------------------------------------------------------------
*/

const authSlice = createSlice({
  name: "auth",

  initialState: {
    /*
     * Authenticated user.
     *
     * null = not authenticated.
     */
    user: null,

    /*
     * Tells the application whether the initial
     * authentication check has completed.
     *
     * This is critical for hard refreshes.
     */
    checked: false,

    loading: false,

    error: null,
  },


  /*
  |--------------------------------------------------------------------------
  | Standard Reducers
  |--------------------------------------------------------------------------
  */

  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },


  /*
  |--------------------------------------------------------------------------
  | Async Reducers
  |--------------------------------------------------------------------------
  */

  extraReducers: (builder) => {
    builder

      /*
      |----------------------------------------------------------------------
      | Restore Session
      |----------------------------------------------------------------------
      */

      .addCase(
        restoreSession.pending,
        (state) => {
          state.loading = true;

          state.checked = false;

          state.error = null;
        }
      )

      .addCase(
        restoreSession.fulfilled,
        (state, action) => {
          state.loading = false;

          state.checked = true;

          state.user =
            action.payload;

          state.error = null;
        }
      )

      .addCase(
        restoreSession.rejected,
        (state) => {
          state.loading = false;

          /*
           * Important:
           *
           * The authentication check HAS completed,
           * but there is no valid session.
           */
          state.checked = true;

          state.user = null;

          /*
           * Don't display "Session not found"
           * when someone simply visits the app
           * without being logged in.
           */
          state.error = null;
        }
      )


      /*
      |----------------------------------------------------------------------
      | Login
      |----------------------------------------------------------------------
      */

      .addCase(
        signIn.pending,
        (state) => {
          state.loading = true;

          state.error = null;
        }
      )

      .addCase(
        signIn.fulfilled,
        (state, action) => {
          state.loading = false;

          state.checked = true;

          state.user =
            action.payload;

          state.error = null;
        }
      )

      .addCase(
        signIn.rejected,
        (state, action) => {
          state.loading = false;

          state.checked = true;

          state.user = null;

          state.error =
            action.payload ||
            "Login failed.";
        }
      )


      /*
      |----------------------------------------------------------------------
      | Register
      |----------------------------------------------------------------------
      */

      .addCase(
        signUp.pending,
        (state) => {
          state.loading = true;

          state.error = null;
        }
      )

      .addCase(
        signUp.fulfilled,
        (state, action) => {
          state.loading = false;

          state.checked = true;

          state.user =
            action.payload;

          state.error = null;
        }
      )

      .addCase(
        signUp.rejected,
        (state, action) => {
          state.loading = false;

          state.checked = true;

          state.user = null;

          state.error =
            action.payload ||
            "Registration failed.";
        }
      )


      /*
      |----------------------------------------------------------------------
      | Logout
      |----------------------------------------------------------------------
      */

      .addCase(
        signOut.pending,
        (state) => {
          state.loading = true;

          state.error = null;
        }
      )

      .addCase(
        signOut.fulfilled,
        (state) => {
          state.user = null;

          state.checked = true;

          state.loading = false;

          state.error = null;
        }
      )

      .addCase(
        signOut.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Logout failed.";
        }
      );
  },
});


/*
|--------------------------------------------------------------------------
| Actions
|--------------------------------------------------------------------------
*/

export const {
  clearAuthError,
} = authSlice.actions;


/*
|--------------------------------------------------------------------------
| Reducer
|--------------------------------------------------------------------------
*/

export default authSlice.reducer;