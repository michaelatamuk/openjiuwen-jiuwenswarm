# Headless installs silently become Chinese installs

*Concern: Startup & Configuration*

When stdin isn't a TTY the prompt language defaults to zh with only a log line; Docker/CI/provisioning silently produce a Chinese UI with no flag to avoid it.

_Source: OpenJiuwen action board (by domain)._ 
