// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://127.0.0.1:5500/projectpride/project.html', // Replace with your frontend domain
    optionsSuccessStatus: 200
}));
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// User Schema for Authentication
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Movie Schema
const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    rating: { type: Number, required: true },
    trailerUrl: { type: String, required: true },
});

const Movie = mongoose.model('Movie', movieSchema);

// Joi validation schema
const movieValidationSchema = Joi.object({
    title: Joi.string().required(),
    year: Joi.number().integer().required(),
    genre: Joi.string().required(),
    rating: Joi.number().min(1).max(10).required(),
    trailerUrl: Joi.string().uri().required(),
});

// JWT Secret key
const JWT_SECRET = process.env.JWT_SECRET || 'yourSuperSecretKey';

// Helper function to authenticate using JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'Token required' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Route: Register a new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ message: "All fields are required" });

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
});

// Route: Login user and generate JWT
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid username or password" });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid username or password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// Route: GET all movies with pagination and filtering
app.get('/api/movies', async (req, res) => {
    const { page = 1, limit = 10, genre, rating } = req.query;
    const query = {};
    
    if (genre) query.genre = genre;
    if (rating) query.rating = { $gte: rating };

    try {
        const movies = await Movie.find(query)
                                  .skip((page - 1) * limit)
                                  .limit(limit);
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route: GET a single movie by ID
app.get('/api/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: "Movie not found" });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route: POST a new movie (protected)
app.post('/api/movies', authenticateToken, async (req, res) => {
    const { error } = movieValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const newMovie = new Movie(req.body);
        await newMovie.save();
        res.status(201).json(newMovie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route: PUT update movie (protected)
app.put('/api/movies/:id', authenticateToken, async (req, res) => {
    const { error } = movieValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMovie) return res.status(404).json({ message: "Movie not found" });
        res.json(updatedMovie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route: DELETE movie (protected)
app.delete('/api/movies/:id', authenticateToken, async (req, res) => {
    try {
        const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
        if (!deletedMovie) return res.status(404).json({ message: "Movie not found" });
        res.json({ message: "Movie deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(Server running on port ${PORT});
});