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
| credentials: "include" is important because authentication uses
| the HTTP-only eld_auth cookie.
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

  // DELETE returns HTTP 204 with no response body.
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
| Fetch Trips
|--------------------------------------------------------------------------
*/

export const fetchTrips = createAsyncThunk(
  "trips/fetchTrips",

  async (_, { rejectWithValue }) => {
    try {
      return await request("/trip/");
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch trips."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Create Trip
|--------------------------------------------------------------------------
*/

export const createTrip = createAsyncThunk(
  "trips/createTrip",

  async (tripData, { rejectWithValue }) => {
    try {
      return await request("/trip/", {
        method: "POST",

        body: JSON.stringify(tripData),
      });
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to create trip."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Delete Trip
|--------------------------------------------------------------------------
*/

export const removeTrip = createAsyncThunk(
  "trip/removeTrip",

  async (tripId, { rejectWithValue }) => {
    try {
      await request(
        `/trip/${tripId}/`,
        {
          method: "DELETE",
        }
      );

      return tripId;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to delete trip."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Plan Trip
|--------------------------------------------------------------------------
*/

export const createPlan = createAsyncThunk(
  "trip/createPlan",

  async (tripData, { rejectWithValue }) => {
    try {
      const trip = await request(
        `/trip/`, // ${tripId}/plan/
        {
          method: "POST",
          body: JSON.stringify(tripData),
        }
      );

      if (!trip?.id) {
        throw new Error(
          "Trip was created but no trip ID was returned."
        );
      }

      // STEP 2:
      // Generate route + HOS plan
      const result = await request(
        `/trip/${trip.id}/plan/`,
        {
          method: "POST",
        }
      );

      console.log("PLAN RESULT:", result);

      return result;

    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to plan trip."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Trips Slice
|--------------------------------------------------------------------------
*/

const tripsSlice = createSlice({
  name: "trips",

  initialState: {
    items: [],
    result: null,
    selectedId: null,
    loading: false,
    planning: false,
    error: null,
  },


  /*
  |--------------------------------------------------------------------------
  | Normal Reducers
  |--------------------------------------------------------------------------
  */

  reducers: {
    clearTrips: (state) => {
      state.items = [];
      state.result = null;
      state.selectedId = null;
      state.error = null;
    },

    clearTripError: (state) => {
      state.error = null;
    },

    clearResult: (state) => {
      state.result = null;
      state.selectedId = null;
      state.error = null;
    },

    selectTrip: (state, action) => {
      state.selectedId = action.payload;
      state.result = null;
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
      | Fetch Trips
      |----------------------------------------------------------------------
      */

      .addCase(
        fetchTrips.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTrips.fulfilled,
        (state, action) => {
          state.loading = false;
          state.error = null;

          state.items =
            Array.isArray(action.payload)
              ? action.payload
              : [];
        }
      )

      .addCase(
        fetchTrips.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch trips.";
        }
      )


      /*
      |----------------------------------------------------------------------
      | Create Trip
      |----------------------------------------------------------------------
      */

      .addCase(
        createTrip.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        createTrip.fulfilled,
        (state, action) => {
          state.loading = false;

          if (action.payload) {
            state.trips.unshift(
              action.payload
            );

            state.selectedTrip =
              action.payload;
          }
        }
      )

      .addCase(
        createTrip.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to create trip.";
        }
      )


      /*
      |----------------------------------------------------------------------
      | Plan Trip
      |----------------------------------------------------------------------
      */

      .addCase(
        createPlan.pending,
        (state) => {
          state.planning = true;
            state.loading = true;
  state.error = null;
        }
      )

      .addCase(
        createPlan.fulfilled,
        (state, action) => {
          state.planning = false;
          state.loading = false;
          state.error = null;

          const result =
            action.payload;

          if (!result?.trip) {
            state.error = "Invalid planning response.";
            state.result = null;
            return;
          }

          state.result = result;
          state.selectedId = result.trip.id

          // if (result.trip) {
            // state.selectedId =
            //   result.trip.id;

          const index = state.items.findIndex(
                (trip) =>
                  trip.id ===
                  result.trip.id
              );

            if (index !== -1) {
              state.items[index] =
                result.trip;
            } else {
              state.items.unshift(
                result.trip
              );
            }
          // }
        }
      )

      .addCase(
        createPlan.rejected,
        (state, action) => {
          state.planning = false;
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to plan trip.";
        }
      )


      /*
      |----------------------------------------------------------------------
      | Delete Trip
      |----------------------------------------------------------------------
      */

      .addCase(
        removeTrip.pending,
        (state) => {
          state.error = null;
        }
      )

      .addCase(
        removeTrip.fulfilled,
        (state, action) => {
          const deletedTripId =
            action.payload;

          state.items =
            state.items.filter(
              (trip) =>
                trip.id !==
                deletedTripId
            );

          if (
            state.selectedId ===
            deletedTripId
          ) {
            state.selectedId = null;
            state.result = null;
          }
        }
      )

      .addCase(
        removeTrip.rejected,
        (state, action) => {
          state.error =
            action.payload ||
            "Failed to delete trip.";
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
  clearTrips,
  clearTripError,
  clearSelectedTrip,
  clearResult,
  selectTrip,
} = tripsSlice.actions;


/*
|--------------------------------------------------------------------------
| Reducer
|--------------------------------------------------------------------------
*/

export default tripsSlice.reducer;