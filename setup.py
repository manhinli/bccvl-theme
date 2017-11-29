from setuptools import setup, find_packages


setup(
    name='org.bccvl.theme',
    setup_requires=['setuptools_scm'],
    use_scm_version=True,
    description="BCCVL Diazo Theme",
    long_description=(open("README.rst").read() + "\n" +
                      open("CHANGELOG.rst").read()),
    # Get more strings from
    # http://pypi.python.org/pypi?:action=list_classifiers
    classifiers=[
        "Framework :: Plone",
        "Programming Language :: Python",
    ],
    keywords='',
    author='',
    author_email='',
    url='https://github.com/BCCVL/org.bccvl.theme/',
    license='GPL',
    packages=find_packages(),
    namespace_packages=['org', 'org.bccvl'],
    include_package_data=True,
    zip_safe=False,
    extras_require={
        'test': [
            'plone.app.robotframework',
        ]
    },
    install_requires=[
        'setuptools',
        'plone.app.theming',
        'plone.app.themingplugins',
        # TODO: why do I need to depend on this as it is required for theme
        # preview?
        'cssselect',
    ],
    entry_points={
        'z3c.autoinclude.plugin': [
            'target = plone'
        ]
    }
)
