var esriConfig = {
    apiKey: 'AAPTxy8BH1VEsoebNVZXo8HurMlUiJG8lP1dUYyBp8XeJevdU3txvTLt50d3EfoQm2QWyqO7bs4HRILjYLcEw2Uw5pDuU9Nn-_AFZouEry97NSGWUwElEGqwISVhAaK-QIxm-tUD95U4wYWyZUiImtKEnLYUsjtV1WtknFNHeT3Lwc9GYX4JujTjuZL5R4gsfyekRgBE2yXLC70wjCPYVLQVE_zl-7z-nKIeXVM-9A8DtTQ.AT1_hmdYoaNi'
};

const fetchLoginToken = async () => {
    try {
        const response = await fetch('/api/generateToken')
        const data = await response.json()
        if (data.token) {
            window.loginToken = data.token
            esriConfig.apiKey = data.token
        } else {
            console.error(data.error)
        }
    } catch (error) {
        console.error(error)
    }
}

fetchLoginToken()