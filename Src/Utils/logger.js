let enabled = true;

const config =  {
    logger: {
        colors: {
            RED: "\\x1b[31m",
            GREEN: "\\x1b[32m",
            YELLOW: "\\x1b[33m",
            RESET: "\\x1b[0m"
        },
        error: {
            uncaughtException: "[ERROR HANDLER]",
            unhandledRejection: "[UNHANDLED PROMISE REJECTION]"
        }
    }
}

function unescape(str) {
    return str.replace(/\\x1b/g, '\x1b');
}

const colors = {
    // Foreground colors
    RED: unescape(config.logger.colors.RED),
    GREEN: unescape(config.logger.colors.GREEN),
    YELLOW: unescape(config.logger.colors.YELLOW),
    RESET: unescape(config.logger.colors.RESET),
    
    BG_RED: unescape('\x1b[41m'),
    BG_GREEN: unescape('\x1b[42m'),
    BG_YELLOW: unescape('\x1b[43m'),
    BG_RESET: unescape('\x1b[49m')
};

function currentTime() {
    return new Intl.DateTimeFormat('de-DE', {
        timeZone: 'Europe/Berlin',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date());
}

function err(message, bgColor = '') {
    const bg = bgColor ? colors[`BG_${bgColor.toUpperCase()}`] : '';
    console.log(`${colors.RED}${bg}[${currentTime()}] ${message}${colors.BG_RESET}${colors.RESET}`);
}

function notify(message, bgColor = '') {
    if(!enabled) return;
    const bg = bgColor ? colors[`BG_${bgColor.toUpperCase()}`] : '';
    console.log(`${colors.YELLOW}${bg}[${currentTime()}] ${message}${colors.BG_RESET}${colors.RESET}`);
}

function success(message, bgColor = '') {
    const bg = bgColor ? colors[`BG_${bgColor.toUpperCase()}`] : '';
    console.log(`${colors.GREEN}${bg}[${currentTime()}] ${message}${colors.BG_RESET}${colors.RESET}`);
}

function critical(message, bgColor = '') {
    const bg = bgColor ? colors[`BG_${bgColor.toUpperCase()}`] : '';
    console.log(`${colors.RED}${bg}[${currentTime()}] ${message}${colors.BG_RESET}${colors.RESET}`);
    process.exit(1);
}

function disable()
{
    enabled = false;
}

export default {
    err,
    notify,
    success,
    critical,
    colors,
    error: err,
    disable
};