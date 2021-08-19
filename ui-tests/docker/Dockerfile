# Use base jupyter image that comes with jupyterlab
FROM jupyter/base-notebook

USER root

# Upgrade JupyterLab
RUN python -m pip install --upgrade jupyterlab

# Copying test structure
COPY ./test_structure/ /home/jovyan/work/
RUN chown -R 1000:1000 /home/jovyan/work/

USER 1000
