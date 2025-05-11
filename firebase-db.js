// firebase-db.js - Database functions (no import/export, Firebase via script tag)
// Assumes Firebase is already initialized in a script before this file
// Add user to favorites
function addToFavorites(userId, mealId) {
    return database.ref(`favorites/${userId}/${mealId}`).set({
        mealId: mealId,
        addedAt: new Date().toISOString()
    })
    .then(() => {
        return { success: true, message: "Added to favorites!" };
    })
    .catch((error) => {
        console.error("Error adding to favorites:", error);
        return { success: false, error: error.message };
    });
}

// Remove from favorites
function removeFavorite(userId, mealId) {
    return database.ref(`favorites/${userId}/${mealId}`).remove()
        .then(() => {
            return { success: true, message: "Removed from favorites!" };
        })
        .catch((error) => {
            console.error("Error removing from favorites:", error);
            return { success: false, error: error.message };
        });
}

// Get user's favorites
function getUserFavorites(userId) {
    return database.ref(`favorites/${userId}`).once("value")
        .then((snapshot) => {
            if (!snapshot.exists()) {
                return [];
            }
            
            const favorites = [];
            snapshot.forEach((childSnapshot) => {
                favorites.push({
                    mealId: childSnapshot.val().mealId,
                    addedAt: childSnapshot.val().addedAt
                });
            });
            
            return favorites;
        })
        .catch((error) => {
            console.error("Error getting favorites:", error);
            return [];
        });
}

// Check if meal is in favorites
function checkIfFavorite(userId, mealId) {
    return database.ref(`favorites/${userId}/${mealId}`).once("value")
        .then((snapshot) => {
            return snapshot.exists();
        })
        .catch((error) => {
            console.error("Error checking favorite:", error);
            return false;
        });
}

// Rate a meal
function rateMeal(userId, mealId, rating) {
    return database.ref(`ratings/${userId}/${mealId}`).set({
        rating: rating,
        ratedAt: new Date().toISOString()
    })
    .then(() => {
        return updateAverageRating(mealId);
    })
    .then((avgRating) => {
        return {
            success: true,
            message: "Meal rated successfully!",
            avgRating: avgRating
        };
    })
    .catch((error) => {
        console.error("Error rating meal:", error);
        return { success: false, error: error.message };
    });
}

// Get user's rating for a meal
function getUserRating(userId, mealId) {
    return database.ref(`ratings/${userId}/${mealId}`).once("value")
        .then((snapshot) => {
            if (!snapshot.exists()) {
                return 0;
            }
            return snapshot.val().rating;
        })
        .catch((error) => {
            console.error("Error getting user rating:", error);
            return 0;
        });
}

// Get user's ratings
function getUserRatings(userId) {
    return database.ref(`ratings/${userId}`).once("value")
        .then((snapshot) => {
            if (!snapshot.exists()) {
                return [];
            }

            const ratings = [];
            snapshot.forEach((childSnapshot) => {
                ratings.push({
                    mealId: childSnapshot.key,
                    rating: childSnapshot.val().rating,
                    ratedAt: childSnapshot.val().ratedAt
                });
            });

            return ratings;
        })
        .catch((error) => {
            console.error("Error getting user ratings:", error);
            return [];
        });
}

// Update average rating for a meal
function updateAverageRating(mealId) {
    return database.ref(`ratings`).once("value")
        .then((snapshot) => {
            if (!snapshot.exists()) {
                return 0;
            }

            let totalRating = 0;
            let count = 0;

            snapshot.forEach((userSnapshot) => {
                const userRatings = userSnapshot.val();
                if (userRatings[mealId]) {
                    totalRating += userRatings[mealId].rating;
                    count++;
                }
            });

            const avgRating = count > 0 ? (totalRating / count).toFixed(1) : 0;

            return database.ref(`mealAverageRatings/${mealId}`).set({
                avgRating: parseFloat(avgRating),
                ratingCount: count,
                updatedAt: new Date().toISOString()
            })
            .then(() => {
                return parseFloat(avgRating);
            });
        })
        .catch((error) => {
            console.error("Error updating average rating:", error);
            return 0;
        });
}

// Get average rating for a meal
function getAverageRating(mealId) {
    return database.ref(`mealAverageRatings/${mealId}`).once("value")
        .then((snapshot) => {
            if (!snapshot.exists()) {
                return 0;
            }
            return snapshot.val().avgRating;
        })
        .catch((error) => {
            console.error("Error getting average rating:", error);
            return 0;
        });
}
