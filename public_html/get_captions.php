<?php
// Set your API key
$apiKey = 'AIzaSyBtyQycCNZqvJhT6SdUOOv0iiUPe1_xwdcNo';

// Get the video ID from the query parameter
$videoId = $_GET['videoId'];

// Make a request to the YouTube Data API to get the captions list
$captionsListUrl = "https://www.googleapis.com/youtube/v3/captions?videoId=$videoId&part=snippet&key=$apiKey";
$captionsListResponse = file_get_contents($captionsListUrl);
$captionsListData = json_decode($captionsListResponse, true);

// Check if captions are available for the specified language (e.g., 'en')
$captionId = null;
foreach ($captionsListData['items'] as $caption) {
    if ($caption['snippet']['language'] === 'en') {
        $captionId = $caption['id'];
        break;
    }
}

if ($captionId) {
    // Make a request to the YouTube Data API to get the caption data
    $captionsUrl = "https://www.googleapis.com/youtube/v3/captions/$captionId?key=$apiKey";
    $captionsResponse = file_get_contents($captionsUrl);
    echo $captionsResponse;
} else {
    echo 'No captions found for the specified language.';
}
?>