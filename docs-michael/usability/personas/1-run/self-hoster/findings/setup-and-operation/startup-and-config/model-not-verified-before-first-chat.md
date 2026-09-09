# Nothing verifies the model before the first conversation

*Concern: Startup & Configuration*

Setup never gates on a real model completion; jiuwenswarm-init never touches model config, pushing model-config errors into first use instead of catching them at write time.

_Source: OpenJiuwen action board (by domain)._ 
