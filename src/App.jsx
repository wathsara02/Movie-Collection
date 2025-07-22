import React, {useState} from "react";
import Search from "./components/search.jsx";
import Spinner from "./components/spinner.jsx";
import {useEffect} from "react";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";


const API_BASE_URL= 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
    }
};

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState();
    const [movieList, setmovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [trendingMovies, setTrendingMovies] = useState([])
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])
    const fetchMovies = async (query ='') =>{
        setIsLoading(true)
        setErrorMessage('')
        try{
            const endpoint= query
                ?`${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                :`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);

            if(!response.ok){
                throw new Error(response.statusText);
            }
            const data = await response.json();

            if(!Array.isArray(data.results)) {
                setErrorMessage(data.Error || 'Failed to get the list of movies.');
                setmovieList([])
                return;
            }

            setmovieList(data.results || [])
            if(query && data.results.length>0){
                await updateSearchCount(query, data.results[0])
            }
        }catch(error){
            console.error(`Error fetching movies : ${error}`);
            setErrorMessage('Error fetching movies try again');
        }
        finally{
            setIsLoading(false)
        }
            };

    const loadTrendingMovie = async () =>{
        try{
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        }catch(error){
            console.error(`Error fetching trending movie: ${error}`);
        }
    }
    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovie()
    },[])
    return (
        <main>
            <div className="pattern"/>

            <div className="wrapper">
                <header>
                    <img src="./hero-image.png" alt="Hero Banner"/>
                    <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without The Hassle</h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0&&(
                    <section className="trending">
                        <ul>
                            {trendingMovies.map((movie, index) =>(
                                <li key={movie.$id}>
                                    <p>{index +1}</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section className="all-movies">
                    <h2 className="mt-[40px]">All Movies</h2>
                    {isLoading? (
                        <Spinner></Spinner>
                    ): errorMessage ?(
                        <p className="text-red-500">{errorMessage}</p>
                    ): (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie}/>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}
export default App
